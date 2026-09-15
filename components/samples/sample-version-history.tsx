"use client";

import { Badge, Card } from "../ui/primitives";
import { SampleStatusBadge } from "./sample-list";
import { compareVersions, isFeedbackOpen } from "./sample-data";
import type { SampleContext } from "./sample-data";
import { useI18n } from "../providers/language-provider";

export function SampleVersionHistory({ context }: { context: SampleContext }) {
  const { t, label, text, formatDate } = useI18n();
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>{t("sample.versionEvolution")}</h2><p>{t("sample.versionEvolutionHelp")}</p></div><Badge>{t("common.count", { count: context.versions.length })}</Badge></div><ol className="sample-version-timeline">{context.versions.map((version, index) => {
    const feedback = context.feedback.filter((item) => item.sampleVersionId === version.id);
    const inherited = context.feedback.filter((item) => version.revisionFeedbackIds?.includes(item.id));
    return <li key={version.id} className={version.id === context.current?.id ? "current-version" : ""}><span className="version-node">{version.version}</span><div className="version-content"><div className="version-heading"><h3>{text(version.summary)}</h3><SampleStatusBadge status={version.status === "已确认" ? "Approved" : version.status === "需修改" ? "Revision Required" : version.sentDate ? "Client Reviewing" : version.status === "待制作" ? "Requested" : "In Development"} /></div><p className="version-dates">{formatDate(version.createdAt)} · {version.sentDate ? formatDate(version.sentDate) : t("common.notSent")}</p><p className="version-reason"><b>{t("common.reason")}</b>{text(version.reasonForChange ?? (index ? t("common.notConfirmed") : "初始开发申请"))}</p><ul className="version-changes">{version.changes.map((change) => <li key={change}>{text(change)}</li>)}</ul>{inherited.length > 0 && <div className="revision-requirements"><b>{t("sample.revisionRequired")}</b>{inherited.map((item) => <p key={item.id}><span>{isFeedbackOpen(item) ? `○ ${label("Open")}` : `✓ ${label("Resolved")}`}</span>{text(item.requiredAction ?? item.summary)}</p>)}</div>}{version.internalNote && <p className="version-internal">{t("quotation.internalNote")} · {text(version.internalNote)}</p>}{feedback.map((item) => <div className="version-feedback-bridge" key={item.id}><span>↳ {t("sample.feedback")} · {formatDate(item.receivedAt)} · {item.author}</span><strong>{text(item.summary)}</strong><p>{text(item.details)}</p><small>{item.resolvedInVersionId ? `${label("Resolved")} · ${item.resolvedInVersionId.split("-").at(-1)}` : isFeedbackOpen(item) ? label("Open") : label("Confirmed")}</small></div>)}</div></li>;
  })}</ol></Card>;
}

export function SampleVersionComparison({ context }: { context: SampleContext }) {
  const changes = compareVersions(context);
  const { language, t, label, text } = useI18n();
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>{t("sample.compare")}</h2><p>{context.versions.at(-2)?.version ?? (language === "zh" ? "上一版" : "Previous")} → {context.current?.version}</p></div><Badge>{t("sample.changes", { count: changes.length })}</Badge></div>{changes.length ? <div className="sample-comparison-scroll"><table className="sample-comparison-table"><thead><tr><th>{t("common.field")}</th><th>{language === "zh" ? "上一版" : "Previous"}</th><th>{t("common.current")}</th></tr></thead><tbody>{changes.map((row) => <tr key={row.key}><td>{label(row.key)}</td><td>{row.previous.value ? text(row.previous.value) : t("common.notConfirmed")}<small>{label(row.previous.status)}</small></td><td>{row.value ? text(row.value) : t("common.notConfirmed")}<small>{label(row.status)}</small></td></tr>)}</tbody></table></div> : <p className="sample-empty">{language === "zh" ? (context.versions.length < 2 ? "只有一个版本，暂无可比较的上一版。" : "规格继承自上一版，目前没有字段变化；修改要求可在版本记录中查看。") : (context.versions.length < 2 ? "Only one version exists; there is no previous version to compare." : "Specifications are inherited from the previous version; no field changes are recorded.")}</p>}</Card>;
}
