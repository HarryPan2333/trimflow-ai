"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "../providers/language-provider";
import { Badge, Button, Card, Modal } from "../ui/primitives";
import { EvidencePanel } from "./activity-evidence";
import type { BusinessSources } from "../../lib/activity-memory/source-adapters";
import type { ActivityMemoryItem } from "../../lib/activity-memory/types";
import type { FinalReportDTO, ReportBlock, ReportContextSnapshot, ReportDraft } from "../../lib/reports/types";
import { addCalendarDays } from "../../lib/reports/period";

function BlockText({ block, outputLanguage }: { block: ReportBlock; outputLanguage: ReportDraft["language"] }) {
  return <div className="report-block-text">{outputLanguage !== "en" && <p>{block.text.zh}</p>}{outputLanguage !== "zh" && <p>{block.text.en}</p>}</div>;
}

export function ReportDetail({ draft, final, context, sources, onEdit, onAddNote, onReview, onFinalize, onRegenerate, onBack, onCopy }: {
  draft: ReportDraft; final?: FinalReportDTO; context: ReportContextSnapshot; sources: BusinessSources;
  onEdit: (blockId: string, text: { zh: string; en: string }) => void; onAddNote: (text: { zh: string; en: string }) => void;
  onReview: () => void; onFinalize: () => void; onRegenerate: () => void; onBack: () => void; onCopy: () => void;
}) {
  const { t, language, text } = useI18n();
  const [editing, setEditing] = useState<ReportBlock | "new" | null>(null);
  const [source, setSource] = useState<ActivityMemoryItem | null>(null);
  const [editZh, setEditZh] = useState("");
  const [editEn, setEditEn] = useState("");
  const sections = final?.sections ?? draft.sections;
  const openEdit = (block: ReportBlock | "new") => { setEditing(block); setEditZh(block === "new" ? "" : block.text.zh); setEditEn(block === "new" ? "" : block.text.en); };
  const save = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!editing) return; if (editing === "new") onAddNote({ zh: editZh, en: editEn }); else onEdit(editing.id, { zh: editZh, en: editEn }); setEditing(null); };
  const sourcesFor = (block: ReportBlock) => context.memory.filter((item) => block.memoryRevisionIds.includes(item.id));
  return <div className="report-detail">
    <div className="report-detail-top"><button className="report-back" onClick={onBack}>← {t("report.reportList")}</button><div className="report-detail-actions"><Button variant="secondary" onClick={onCopy}>{t("report.copy")}</Button>{!final && <Button variant="secondary" onClick={onRegenerate}>{t("report.regenerate")}</Button>}</div></div>
    <Card className="report-detail-header"><div><span className="eyebrow">TRIMFLOW · {t("report.synthetic")}</span><h2>{draft.kind === "daily" ? t("report.daily") : t("report.weekly")} · {draft.period.localStartDate}{draft.kind === "weekly" ? ` — ${addCalendarDays(draft.period.localEndDate, -1)}` : ""}</h2><p>{sources.accounts.actors.find((actor) => actor.id === draft.ownerActorId)?.displayName[language] ?? draft.ownerActorId} · {t(`report.${draft.attributionMode}`)} · {draft.period.timeZone} · {t("report.prototype")}</p></div><Badge tone={final ? "green" : draft.status === "reviewed" ? "blue" : "neutral"}>{t(`report.${final ? "final" : draft.status}`)}</Badge></Card>
    <div className="report-metrics"><Card><span>{t("report.metricSources")}</span><strong>{context.sourceCount}</strong></Card><Card><span>{t("report.metricExcluded")}</span><strong>{context.excludedSourceCount}</strong></Card><Card><span>{t("report.metricIssues")}</span><strong>{(final?.validation ?? draft.validation).issues.length}</strong></Card></div>
    <div className="report-detail-grid"><div className="report-content">
      {!context.memory.some((item) => !item.manual) && <Card><p className="report-empty">{t("report.empty")}</p></Card>}
      {sections.length ? sections.map((section) => <Card className="report-section" key={section.id}><h3>{text(section.title)}</h3>{section.blocks.map((block) => <div className="report-block" key={block.id}><div className="report-block-header"><Badge tone={block.kind === "fact" ? "blue" : block.kind === "human_note" ? "neutral" : "amber"}>{t(`report.${block.kind}`)}</Badge><div>{block.kind === "fact" && sourcesFor(block).map((item, index) => <button key={item.id} onClick={() => setSource(item)}>{t("report.viewSource")} {sourcesFor(block).length > 1 ? index + 1 : ""} · {t("report.whyIncluded")}</button>)}{!final && <button onClick={() => openEdit(block)}>{t("report.edit")}</button>}</div></div><BlockText block={block} outputLanguage={draft.language} />{block.kind === "human_note" && <small>{t("report.manualHelp")}</small>}{block.kind === "recommendation" && <small>{block.actionKind === "existing_task" ? `${t("report.source")}: ${block.actionSource?.recordId}` : t("report.pending")}</small>}</div>)}</Card>) : <Card><p className="report-empty">{t("report.empty")}</p></Card>}
      {!final && <div className="report-action-bar"><Button variant="secondary" onClick={() => openEdit("new")}>＋ {t("report.addNote")}</Button>{draft.status === "draft" && <Button variant="secondary" onClick={onReview}>{t("report.review")}</Button>}{draft.status === "reviewed" && <Button onClick={onFinalize}>{t("report.finalize")}</Button>}</div>}
    </div><aside className="report-side"><Card><h3>{t("report.validation")}</h3><p>{draft.validation.issues.length ? draft.validation.issues.join(" · ") : t(draft.attributionMode === "team" ? "report.teamIncludeReason" : "report.includeReason")}</p>{draft.validation.warnings.length > 0 && <p>{draft.validation.warnings.length} {t("report.human_note")} · {t("report.pending")}</p>}</Card><Card><h3>{t("report.sources")}</h3><p>{context.memory.length} Activity Memory · {context.evidence.length} EvidenceReference</p><p>{t("report.finalHelp")}</p></Card></aside></div>
    {editing && <Modal title={editing === "new" ? t("report.addNote") : t("report.edit")} onClose={() => setEditing(null)}><form className="modal-form" onSubmit={save}><p className="report-demo-note">{t("report.manualHelp")}</p><label>中文<textarea value={editZh} onChange={(event) => setEditZh(event.target.value)} required rows={4} /></label><label>English<textarea value={editEn} onChange={(event) => setEditEn(event.target.value)} required rows={4} /></label><div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setEditing(null)}>{t("report.cancel")}</Button><Button type="submit">{t("report.save")}</Button></div></form></Modal>}
    {source && <EvidencePanel item={source} sources={sources} attributionMode={draft.attributionMode} onClose={() => setSource(null)} />}
  </div>;
}
