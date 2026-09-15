"use client";

import { Badge, Button, Card } from "../ui/primitives";
import { getDevelopmentBlockers, getSampleNextAction, getSampleReadiness, getSampleStatus } from "./sample-data";
import type { SampleContext } from "./sample-data";
import { useI18n } from "../providers/language-provider";

export function SampleReadiness({ context, onQuotation }: { context: SampleContext; onQuotation: () => void }) {
  const { language, t, label, text } = useI18n();
  const result = getSampleReadiness(context, language);
  return <Card className="sample-section sample-readiness"><div className="sample-section-head"><div><h2>{t("sample.readinessTitle")}</h2><p>{t("sample.ruleCheck")}</p></div><Badge tone={result.ready ? "green" : "amber"}>{result.ready ? label("Ready") : t("sample.notReady")}</Badge></div><ul className="readiness-list">{result.criteria.map((item) => <li key={item.key}><span>{label(item.key)}</span><b className={item.ready ? "ready" : "pending"}>{item.ready ? "✓" : "!"}</b></li>)}</ul><div className="readiness-result"><strong>{result.ready ? t("sample.ready") : t("sample.notReady")}</strong>{result.reasons.slice(0, 3).map((reason) => <p key={reason}>{text(reason)}</p>)}{(result.ready || getSampleStatus(context) === "Approved") && <Button onClick={onQuotation}>{t("actions.createQuotation")} →</Button>}</div></Card>;
}

export function SampleBlockers({ context }: { context: SampleContext }) {
  const { language, t, label, text } = useI18n();
  const blockers = getDevelopmentBlockers(context, language);
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>{t("sample.developmentBlockers")}</h2><p>{t("sample.blockers")}</p></div><Badge>{blockers.length}</Badge></div><div className="sample-blocker-list">{blockers.map((item, index) => <article key={`${item.type}-${index}`}><div><Badge>{label(item.type)}</Badge><Badge tone={item.severity === "Blocking" ? "red" : item.severity === "Important" ? "amber" : "neutral"}>{label(item.severity)}</Badge></div><strong>{text(item.reason)}</strong><p>{text(item.action)}</p><small>{t("common.owner")} · {text(item.owner)}</small></article>)}{!blockers.length && <p className="sample-empty">{t("sample.noBlockers")}</p>}</div></Card>;
}

export function SampleNextAction({ context }: { context: SampleContext }) {
  const { language, t, text } = useI18n();
  const next = getSampleNextAction(context, language);
  return <Card className="sample-section sample-next-card"><div className="sample-section-head"><div><h2>{t("project.nextBestActions")}</h2><p>{t("sample.nextAction")}</p></div><span className="sample-action-arrow">↗</span></div><div className="sample-next-body"><h3>{text(next.action)}</h3><p><b>{t("sample.why")}</b>{text(next.why)}</p><dl><div><dt>{t("common.owner")}</dt><dd>{text(next.owner)}</dd></div><div><dt>{t("common.timing")}</dt><dd>{text(next.timing)}</dd></div></dl></div></Card>;
}
