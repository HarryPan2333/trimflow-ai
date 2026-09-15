"use client";

import { Badge } from "../ui/primitives";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import { feedbackSummary, getSampleNextAction, getSampleStatus } from "./sample-data";
import type { DevelopmentStatus, SampleContext } from "./sample-data";
import { useI18n } from "../providers/language-provider";

const tones: Record<DevelopmentStatus, string> = { Requested: "neutral", "In Development": "blue", Ready: "cyan", Sent: "blue", "Client Reviewing": "amber", "Revision Required": "orange", Approved: "green", Rejected: "red", Closed: "neutral" };

export function SampleStatusBadge({ status }: { status: DevelopmentStatus; language?: InterfaceLanguage }) {
  const { label } = useI18n();
  return <Badge tone={tones[status]}>{label(status)}</Badge>;
}

export function SampleList({ rows, onOpenSample, language }: { rows: SampleContext[]; onOpenSample: (id: string) => void; language: InterfaceLanguage }) {
  const { t, label, text, formatDate } = useI18n();
  return <>
    <div className="sample-table-scroll"><table className="sample-table"><thead><tr>
      <th>Sample</th><th>{t("common.client")} · {t("common.project")}</th><th>{t("common.type")}</th><th>{t("common.version")}</th><th>{t("common.status")}</th><th>{t("common.dates")}</th><th>{t("common.feedback")}</th><th>{t("common.owner")}</th><th>{t("common.nextAction")}</th>
    </tr></thead><tbody>{rows.map((context) => {
      const { sample, current, client, project } = context;
      return <tr key={sample.id}><td><button className="sample-id-link" onClick={() => onOpenSample(sample.id)}>{sample.id} <span>↗</span></button><strong>{text(sample.product)}</strong></td><td><span>{text(client?.name ?? project?.customer ?? "")}</span><small>{project?.code} · {text(project?.name ?? "")}</small></td><td>{sample.sampleType ? label(sample.sampleType) : t("common.pendingConfirmation")}</td><td><b className="sample-version-pill">{current?.version ?? "—"}</b></td><td><SampleStatusBadge status={getSampleStatus(context)} language={language} /></td><td className="sample-dates"><span>{formatDate(sample.createdAt)}</span><span>{sample.targetDate ? formatDate(sample.targetDate) : t("common.pendingConfirmation")}</span><span>{current?.sentDate ? formatDate(current.sentDate) : t("common.notSent")}</span></td><td>{text(feedbackSummary(context))}</td><td>{text(sample.owner ?? project?.owner ?? t("common.notAssigned"))}</td><td>{text(getSampleNextAction(context, language).action)}</td></tr>;
    })}</tbody></table></div>
    <div className="sample-mobile-list">{rows.map((context) => <button className="sample-mobile-row" key={context.sample.id} onClick={() => onOpenSample(context.sample.id)}><span className="sample-mobile-heading"><strong>{context.sample.id}</strong><SampleStatusBadge status={getSampleStatus(context)} language={language} /></span><span>{text(context.client?.name ?? context.project?.customer ?? "")}</span><b>{text(context.sample.product)}<i>{context.current?.version}</i></b><span className="sample-mobile-next">→ {text(getSampleNextAction(context, language).action)}</span></button>)}</div>
    {rows.length === 0 && <div className="sample-empty">{t("sample.noMatch")}</div>}
  </>;
}
