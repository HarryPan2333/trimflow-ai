"use client";

import { Badge, Button } from "../ui/primitives";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import { getSampleReadiness, getSampleStatus } from "./sample-data";
import type { SampleContext } from "./sample-data";
import { SampleStatusBadge } from "./sample-list";
import { useI18n } from "../providers/language-provider";

export function SampleHeader({ context, language, onBack, onClient, onProject, onAction }: { context: SampleContext; language: InterfaceLanguage; onBack: () => void; onClient: () => void; onProject: () => void; onAction: (action: "feedback" | "revision" | "sent" | "approved") => void }) {
  const { sample, current } = context;
  const { t, label, text, formatDate } = useI18n();
  const status = getSampleStatus(context);
  const approvalAllowed = getSampleReadiness(context).specsReady && Boolean(current?.sentDate) && status !== "Approved" && !["Rejected", "Closed"].includes(status);
  return <header className="sample-detail-header">
    <div className="sample-breadcrumb"><button onClick={onBack}>‹ {t("sample.centerTitle")}</button><span>/</span><button onClick={onClient}>{text(context.client?.name ?? context.project?.customer ?? "")}</button><span>/</span><button onClick={onProject}>{context.project?.code}</button></div>
    <div className="sample-title-line"><div className="sample-title"><span className="sample-object-icon">◈</span><div><span>{sample.id}</span><h1>{text(sample.product)}</h1><p>{text(context.project?.name ?? "")}</p></div></div><div className="sample-header-badges"><b className="sample-version-pill">{current?.version}</b><SampleStatusBadge status={status} language={language} /><Badge>{t("common.demoWorkspace")}</Badge></div></div>
    <div className="sample-header-bottom"><dl><div><dt>{t("sample.type")}</dt><dd>{sample.sampleType ? label(sample.sampleType) : t("common.pendingConfirmation")}</dd></div><div><dt>{t("common.owner")}</dt><dd>{text(sample.owner ?? context.project?.owner ?? t("common.notAssigned"))}</dd></div><div><dt>{t("sample.targetDate")}</dt><dd>{sample.targetDate ? formatDate(sample.targetDate) : t("common.pendingConfirmation")}</dd></div></dl><div className="sample-header-actions"><Button variant="secondary" onClick={() => onAction("feedback")}>＋ {t("sample.addFeedback")}</Button><Button variant="secondary" onClick={() => onAction("revision")}>{t("sample.createRevision")}</Button><Button variant="secondary" disabled={Boolean(current?.sentDate) || !current} onClick={() => onAction("sent")}>{t("sample.markSent")}</Button><Button disabled={!approvalAllowed} title={approvalAllowed ? "" : t("sample.notReady")} onClick={() => onAction("approved")}>{t("sample.markApproved")}</Button></div></div>
  </header>;
}
