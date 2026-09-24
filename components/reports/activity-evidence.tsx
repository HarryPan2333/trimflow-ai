"use client";

import { useMemo, useState } from "react";
import { useI18n } from "../providers/language-provider";
import { Badge, Button, Card, Modal } from "../ui/primitives";
import { businessDate, selectMemory, type MemoryDecision } from "../../lib/activity-memory/selectors";
import type { ActivityMemoryItem } from "../../lib/activity-memory/types";
import type { BusinessSources } from "../../lib/activity-memory/source-adapters";
import type { ReportPeriod } from "../../lib/reports/types";
import { addCalendarDays } from "../../lib/reports/period";

export function reasonLabel(reason: string, t: ReturnType<typeof useI18n>["t"]): string {
  if (reason === "outside_period") return t("report.outsidePeriod");
  if (reason === "actor_unknown") return t("report.noPerformer");
  if (reason === "other_actor") return t("report.otherActor");
  if (reason === "background_only") return t("report.backgroundOnly");
  if (reason === "unknown_business_time") return t("report.unknownTime");
  if (reason === "superseded" || reason === "voided") return t("report.duplicate");
  if (reason === "internal_governance") return t("report.backgroundOnly");
  if (reason === "account_filter" || reason === "project_filter") return t("report.excluded");
  return `${t("report.invalid")}: ${reason}`;
}

export function EvidencePanel({ item, sources, decision, attributionMode, onClose }: { item: ActivityMemoryItem; sources: BusinessSources; decision?: MemoryDecision; attributionMode: "personal" | "team"; onClose: () => void }) {
  const { t, text, language } = useI18n();
  const actor = (id?: string) => sources.accounts.actors.find((row) => row.id === id)?.displayName[language] ?? t("report.unknown");
  return <Modal title={t("report.sources")} onClose={onClose}>
    <div className="report-source-panel">
      <p className="report-demo-note">{t("report.synthetic")} · {item.manual ? t("report.manual") : t("report.prototype")}</p>
      <h3>{text(item.summary)}</h3>
      <p>{t("report.businessDate")}: {businessDate(item.occurred, "Asia/Shanghai") ?? t("report.unknownTime")}</p>
      <p>{t("report.actor")}: {actor(item.attribution.performedByActorId)}</p>
      <p>{decision && !decision.eligible ? `${t("report.excludedReason")}: ${decision.reasons.map((reason) => reasonLabel(reason, t)).join(" · ")}` : `${t("report.whyIncluded")}: ${item.manual ? t("report.manualHelp") : t(attributionMode === "team" ? "report.teamIncludeReason" : "report.includeReason")}`}</p>
      <ol className="report-source-chain">
        <li>Activity Memory · {item.id} · r{item.revision}</li>
        {item.evidence.map((ref) => <li key={ref.id}>{ref.role === "primary" ? t("report.source") : ref.role === "lineage" ? "↳" : ref.role} · {ref.recordType} · {ref.recordId} {ref.recordType === "deal_message" ? `(${t("report.pending")})` : ""}</li>)}
      </ol>
      <p className="report-source-warning">{t("report.validation")}: {item.evidence.length} {t("report.metricSources").toLowerCase()}. {item.manual ? t("report.manualHelp") : t("report.synthetic")}</p>
      <div className="modal-actions"><Button variant="secondary" onClick={onClose}>{t("actions.close")}</Button></div>
    </div>
  </Modal>;
}

export function ActivityEvidence({ items, sources, period, ownerActorId, attributionMode, accountId, projectId, onAddManual }: {
  items: ActivityMemoryItem[]; sources: BusinessSources; period: ReportPeriod; ownerActorId?: string; attributionMode: "personal" | "team"; accountId?: string; projectId?: number; onAddManual: () => void;
}) {
  const { t, text, language } = useI18n();
  const [showExcluded, setShowExcluded] = useState(false);
  const [selected, setSelected] = useState<MemoryDecision | null>(null);
  const decisions = useMemo(() => selectMemory(items, sources, { start: period.localStartDate, end: period.localEndDate, timeZone: period.timeZone, ownerActorId, accountId, projectId }), [items, sources, period, ownerActorId, accountId, projectId]);
  const visible = decisions.filter((row) => showExcluded || row.eligible);
  return <div className="report-evidence-view">
    <div className="report-section-heading"><div><h2>{t("report.evidence")}</h2><p>{period.localStartDate}{period.kind === "weekly" ? ` — ${addCalendarDays(period.localEndDate, -1)}` : ""} · {t("report.synthetic")}</p></div><Button onClick={onAddManual}>＋ {t("report.addActivity")}</Button></div>
    <div className="report-inline-filters"><button className={!showExcluded ? "active" : ""} onClick={() => setShowExcluded(false)}>{t("report.included")} ({decisions.filter((row) => row.eligible).length})</button><button className={showExcluded ? "active" : ""} onClick={() => setShowExcluded(true)}>{t("report.all")} ({decisions.length})</button></div>
    <Card className="report-evidence-table"><div className="report-evidence-head"><span>{t("report.businessDate")}</span><span>{t("common.projectAndClient")}</span><span>{t("report.category")}</span><span>{t("report.actor")}</span><span>{t("report.status")}</span><span>{t("report.metricSources")}</span></div>
      {visible.map(({ item, eligible, reasons }) => <button key={item.id} className="report-evidence-row" onClick={() => setSelected({ item, eligible, reasons })}><span>{businessDate(item.occurred, period.timeZone) ?? t("report.unknownTime")}</span><span>{item.projectId ? sources.projects.find((row) => row.id === item.projectId)?.code : sources.accounts.accounts.find((row) => row.id === item.accountId)?.name ?? "—"}<small>{text(item.summary)}</small></span><span>{t(`report.category.${item.category}`)} {item.manual && <small>{t("report.manual")}</small>}</span><span>{sources.accounts.actors.find((row) => row.id === item.attribution.performedByActorId)?.displayName[language] ?? t("report.noPerformer")}</span><span><Badge tone={eligible ? "green" : "neutral"}>{eligible ? t("report.included") : t("report.excluded")}</Badge>{!eligible && <small>{reasons.slice(0, 2).map((reason) => reasonLabel(reason, t)).join(" · ")}</small>}</span><span>{item.evidence.length} →</span></button>)}
      {!visible.length && <p className="report-empty">{t("report.empty")}</p>}
    </Card>
    {selected && <EvidencePanel item={selected.item} sources={sources} decision={selected} attributionMode={attributionMode} onClose={() => setSelected(null)} />}
  </div>;
}
