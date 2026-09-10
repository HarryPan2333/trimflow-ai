"use client";

import { Badge, Button, Card } from "../ui/primitives";
import { categoryLabels, isFeedbackOpen, severityLabels } from "./sample-data";
import type { SampleContext } from "./sample-data";

export function SampleFeedbackPanel({ context, onAdd, onResolve, onRevision }: { context: SampleContext; onAdd: () => void; onResolve: (id: string) => void; onRevision: () => void }) {
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>客户反馈 / Customer Feedback</h2><p>阻塞：无法继续 · 重要：影响确认 · 建议：优化项</p></div><Button variant="secondary" onClick={onAdd}>＋ 添加反馈</Button></div><div className="sample-feedback-list">{[...context.feedback].reverse().map((feedback) => {
    const open = isFeedbackOpen(feedback);
    const severity = feedback.severity ?? (feedback.requiresRevision ? "Important" : "Minor");
    return <article key={feedback.id}><div className="feedback-meta"><Badge tone={severity === "Blocking" ? "red" : severity === "Important" ? "amber" : "neutral"}>{severityLabels[severity]} / {severity}</Badge><Badge>{categoryLabels[feedback.category ?? "Other"]}</Badge><span>{feedback.receivedAt} · {feedback.channel} · {feedback.author} · {feedback.sampleVersionId.split("-").at(-1)}</span><Badge tone={open ? "amber" : "green"}>{open ? "Open / 待处理" : "Resolved / 已处理"}</Badge></div><h3>{feedback.summary}</h3><p>{feedback.details}</p><div className="feedback-action"><b>所需行动 / Required Action</b><span>{feedback.requiredAction ?? "无需进一步修改"}</span></div>{open && <div className="feedback-controls"><Button variant="ghost" onClick={() => onResolve(feedback.id)}>标记已解决</Button>{feedback.requiresRevision && <Button variant="secondary" onClick={onRevision}>基于反馈创建新版本 →</Button>}</div>}</article>;
  })}{context.feedback.length === 0 && <p className="sample-empty">当前版本尚未收到客户反馈。</p>}</div></Card>;
}
