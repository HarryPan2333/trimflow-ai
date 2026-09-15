"use client";

import { Badge, Button, Card } from "../ui/primitives";
import { isFeedbackOpen } from "./sample-data";
import type { SampleContext } from "./sample-data";
import { useI18n } from "../providers/language-provider";

export function SampleFeedbackPanel({ context, onAdd, onResolve, onRevision }: { context: SampleContext; onAdd: () => void; onResolve: (id: string) => void; onRevision: () => void }) {
  const { t, label, text, formatDate } = useI18n();
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>{t("sample.feedback")}</h2><p>{t("sample.feedbackSeverityHelp")}</p></div><Button variant="secondary" onClick={onAdd}>＋ {t("sample.addFeedback")}</Button></div><div className="sample-feedback-list">{[...context.feedback].reverse().map((feedback) => {
    const open = isFeedbackOpen(feedback);
    const severity = feedback.severity ?? (feedback.requiresRevision ? "Important" : "Minor");
    return <article key={feedback.id}><div className="feedback-meta"><Badge tone={severity === "Blocking" ? "red" : severity === "Important" ? "amber" : "neutral"}>{label(severity)}</Badge><Badge>{label(feedback.category ?? "Other")}</Badge><span>{formatDate(feedback.receivedAt)} · {feedback.channel} · {feedback.author} · {feedback.sampleVersionId.split("-").at(-1)}</span><Badge tone={open ? "amber" : "green"}>{label(open ? "Open" : "Resolved")}</Badge></div><h3>{text(feedback.summary)}</h3><p>{text(feedback.details)}</p><div className="feedback-action"><b>{t("sample.requiredAction")}</b><span>{text(feedback.requiredAction ?? t("sample.noFurtherRevision"))}</span></div>{open && <div className="feedback-controls"><Button variant="ghost" onClick={() => onResolve(feedback.id)}>{t("actions.resolve")}</Button>{feedback.requiresRevision && <Button variant="secondary" onClick={onRevision}>{t("actions.createRevisionFromFeedback")} →</Button>}</div>}</article>;
  })}{context.feedback.length === 0 && <p className="sample-empty">{t("sample.feedbackEmpty")}</p>}</div></Card>;
}
