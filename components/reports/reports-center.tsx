"use client";

import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "../layout/page-header";
import { useI18n } from "../providers/language-provider";
import { Badge, Button, Card, Modal } from "../ui/primitives";
import { ActivityEvidence } from "./activity-evidence";
import { ReportDetail } from "./report-detail";
import type { BusinessSources } from "../../lib/activity-memory/source-adapters";
import type { ActivityCategory, ActivityMemoryItem, ManualActivityEntry } from "../../lib/activity-memory/types";
import { addCalendarDays, createReportPeriod, DEMO_REPORT_DATE, DEMO_REPORT_TIME_ZONE } from "../../lib/reports/period";
import type { AttributionMode, ReportKind, ReportLanguage, ReportState } from "../../lib/reports/types";

const manualCategories: ActivityCategory[] = ["customer_interaction", "project_update", "sample_update", "commercial_update", "task_update", "relationship_update", "order_update", "internal_coordination"];
type ReportsTab = ReportKind | "evidence";

export function ReportsCenter({ sources, items, state, initialTab = "daily", onGenerate, onEdit, onNote, onReview, onFinalize, onManual, onCopy }: {
  sources: BusinessSources; items: ActivityMemoryItem[]; state: ReportState;
  initialTab?: ReportsTab;
  onGenerate: (input: { kind: ReportKind; date: string; timeZone: string; ownerActorId: string; attributionMode: AttributionMode; language: ReportLanguage; accountId?: string; projectId?: number; fromReportId?: string }) => string | undefined;
  onEdit: (reportId: string, blockId: string, text: { zh: string; en: string }) => void; onNote: (reportId: string, text: { zh: string; en: string }) => void;
  onReview: (reportId: string, actorId: string) => void; onFinalize: (reportId: string, actorId: string) => void;
  onManual: (entry: ManualActivityEntry) => void; onCopy: (text: string) => void;
}) {
  const { t, text, language: uiLanguage } = useI18n();
  const [tab, setTab] = useState<ReportsTab>(initialTab);
  const [date, setDate] = useState(DEMO_REPORT_DATE);
  const [timeZone, setTimeZone] = useState(DEMO_REPORT_TIME_ZONE);
  const [ownerActorId, setOwnerActorId] = useState("actor-sales-a");
  const [attributionMode, setAttributionMode] = useState<AttributionMode>("team");
  const [outputLanguage, setOutputLanguage] = useState<ReportLanguage>("zh");
  const [accountId, setAccountId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const period = useMemo(() => createReportPeriod(tab === "evidence" ? "daily" : tab, date, timeZone), [tab, date, timeZone]);
  const selected = state.drafts.find((row) => row.id === selectedReportId);
  const selectedContext = selected && state.contexts.find((row) => row.id === selected.contextSnapshotId);
  const selectedFinal = state.finals.find((row) => row.id === selectedReportId);
  const visibleReports = state.drafts.filter((row) => row.kind === tab && row.ownerActorId === ownerActorId && row.attributionMode === attributionMode && (status === "all" || row.status === status) && (!accountId || state.contexts.find((context) => context.id === row.contextSnapshotId)?.accountId === accountId) && (!projectId || state.contexts.find((context) => context.id === row.contextSnapshotId)?.projectId === Number(projectId))).slice().reverse();
  const doGenerate = (fromReportId?: string) => {
    if (tab === "evidence") return;
    const id = onGenerate({ kind: tab, date, timeZone, ownerActorId, attributionMode, language: outputLanguage, accountId: accountId || undefined, projectId: projectId ? Number(projectId) : undefined, fromReportId });
    if (id) setSelectedReportId(id);
  };
  const copyReport = () => {
    if (!selected) return;
    const sections = selectedFinal?.sections ?? selected.sections;
    const lines = sections.flatMap((section) => [text(section.title), ...section.blocks.map((block) => selected.language === "en" ? block.text.en : selected.language === "bilingual" ? `${block.text.zh}\n${block.text.en}` : block.text.zh), ""]);
    onCopy(lines.join("\n"));
  };
  const saveManual = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const projectIdValue = Number(data.get("projectId"));
    const project = sources.projects.find((row) => row.id === projectIdValue);
    if (!project) return;
    onManual({ id: `manual-${crypto.randomUUID()}`, authorActorId: String(data.get("authorActorId")), performedByActorId: String(data.get("performedByActorId")) || undefined, occurred: { kind: "date", value: String(data.get("date")) }, accountId: project.clientId, projectId: project.id, category: String(data.get("category")) as ActivityCategory, description: String(data.get("description")).trim(), participantActorIds: [], sourceRefs: [], recordedAt: new Date().toISOString() });
    setManualOpen(false);
  };
  return <div className="reports-center">
    <PageHeader title={t("report.title")} subtitle={t("report.subtitle")} actions={<Badge tone="blue">{t("report.synthetic")}</Badge>} />
    <div className="report-tabs" role="tablist" aria-label={t("report.title")}>{(["daily", "weekly", "evidence"] as ReportsTab[]).map((kind) => <button key={kind} role="tab" aria-selected={tab === kind} className={tab === kind ? "active" : ""} onClick={() => { setTab(kind); setSelectedReportId(null); }}>{t(`report.${kind}`)}</button>)}</div>
    <Card className="report-controls"><div className="report-control-grid">
      <label>{t("report.owner")}<select value={ownerActorId} onChange={(event) => setOwnerActorId(event.target.value)}>{sources.accounts.actors.filter((actor) => actor.active).map((actor) => <option value={actor.id} key={actor.id}>{text(actor.displayName)}</option>)}</select></label>
      <label>{t("report.scope")}<select value={attributionMode} onChange={(event) => setAttributionMode(event.target.value as AttributionMode)}><option value="team">{t("report.team")}</option><option value="personal">{t("report.personal")}</option></select></label>
      <label>{t("report.period")}<input type="date" value={date} onChange={(event) => setDate(event.target.value || DEMO_REPORT_DATE)} /></label>
      <label>{t("report.timeZone")}<select value={timeZone} onChange={(event) => setTimeZone(event.target.value)}><option value="Asia/Shanghai">Asia/Shanghai</option><option value="America/Toronto">America/Toronto</option><option value="UTC">UTC</option></select></label>
      <label>{t("report.language")}<select value={outputLanguage} onChange={(event) => setOutputLanguage(event.target.value as ReportLanguage)}><option value="zh">中文</option><option value="en">English</option><option value="bilingual">中文 / English</option></select></label>
      <label>{t("report.account")}<select value={accountId} onChange={(event) => { setAccountId(event.target.value); setProjectId(""); }}><option value="">{t("report.all")}</option>{sources.accounts.accounts.filter((account) => account.recordStatus === "canonical").map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
      <label>{t("report.project")}<select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">{t("report.all")}</option>{sources.projects.filter((project) => !accountId || project.clientId === accountId).map((project) => <option key={project.id} value={project.id}>{project.code}</option>)}</select></label>
      <label>{t("report.status")}<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{t("report.all")}</option><option value="draft">{t("report.draft")}</option><option value="reviewed">{t("report.reviewed")}</option><option value="final">{t("report.final")}</option></select></label>
    </div><div className="report-control-footer"><p>{t("report.demoDate")}: {period.localStartDate}{tab === "weekly" ? ` — ${addCalendarDays(period.localEndDate, -1)}` : ""} · {t("report.sessionNotice")}</p>{tab !== "evidence" && <Button onClick={() => doGenerate()}>{t("report.generate")}</Button>}</div></Card>
    {tab === "evidence" ? <ActivityEvidence items={items} sources={sources} period={period} attributionMode={attributionMode} ownerActorId={attributionMode === "personal" ? ownerActorId : undefined} accountId={accountId || undefined} projectId={projectId ? Number(projectId) : undefined} onAddManual={() => setManualOpen(true)} /> : selected && selectedContext ? <ReportDetail draft={selected} final={selectedFinal} context={selectedContext} sources={sources} onEdit={(blockId, value) => onEdit(selected.id, blockId, value)} onAddNote={(value) => onNote(selected.id, value)} onReview={() => onReview(selected.id, selected.ownerActorId)} onFinalize={() => onFinalize(selected.id, selected.ownerActorId)} onRegenerate={() => doGenerate(selected.id)} onBack={() => setSelectedReportId(null)} onCopy={copyReport} /> : <div className="report-history"><div className="report-section-heading"><h2>{t("report.reportList")}</h2><small>{t("common.records", { count: visibleReports.length })}</small></div><div className="report-history-grid">{visibleReports.map((row) => <Card className="report-history-card" key={row.id}><div className="report-history-top"><Badge tone={row.status === "final" ? "green" : "neutral"}>{t(`report.${row.status}`)}</Badge><small>r{row.revision} · {row.period.timeZone}</small></div><h3>{row.kind === "daily" ? t("report.daily") : t("report.weekly")} · {row.period.localStartDate}</h3><p>{sources.accounts.actors.find((actor) => actor.id === row.ownerActorId)?.displayName[uiLanguage] ?? row.ownerActorId} · {t("common.records", { count: row.sections.reduce((count, section) => count + section.blocks.length, 0) })}</p><Button variant="secondary" onClick={() => setSelectedReportId(row.id)}>{t("report.open")} →</Button></Card>)}{!visibleReports.length && <Card><p className="report-empty">{t("report.noReports")}</p></Card>}</div></div>}
    {manualOpen && <Modal title={t("report.addActivity")} onClose={() => setManualOpen(false)}><form className="modal-form" onSubmit={saveManual}><p className="report-demo-note">{t("report.manualHelp")}</p><label>{t("report.recorder")}<select name="authorActorId" defaultValue={ownerActorId}>{sources.accounts.actors.filter((actor) => actor.active).map((actor) => <option key={actor.id} value={actor.id}>{text(actor.displayName)}</option>)}</select></label><label>{t("report.manualPerformer")}<select name="performedByActorId" defaultValue=""><option value="">{t("report.noPerformer")}</option>{sources.accounts.actors.filter((actor) => actor.active).map((actor) => <option key={actor.id} value={actor.id}>{text(actor.displayName)}</option>)}</select></label><label>{t("report.project")}<select name="projectId" required defaultValue={projectId || sources.projects[0]?.id}>{sources.projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {text(project.name)}</option>)}</select></label><div className="form-row"><label>{t("report.activityDate")}<input name="date" type="date" required defaultValue={date} /></label><label>{t("report.category")}<select name="category">{manualCategories.map((category) => <option key={category} value={category}>{t(`report.category.${category}`)}</option>)}</select></label></div><label>{t("report.description")}<textarea name="description" required maxLength={600} rows={4} /></label><div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setManualOpen(false)}>{t("report.cancel")}</Button><Button type="submit">{t("report.save")}</Button></div></form></Modal>}
  </div>;
}
