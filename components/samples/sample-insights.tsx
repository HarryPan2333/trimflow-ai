import { Badge, Button, Card } from "../ui/primitives";
import { getDevelopmentBlockers, getSampleNextAction, getSampleReadiness, getSampleStatus } from "./sample-data";
import type { SampleContext } from "./sample-data";

export function SampleReadiness({ context, onQuotation }: { context: SampleContext; onQuotation: () => void }) {
  const result = getSampleReadiness(context);
  return <Card className="sample-section sample-readiness"><div className="sample-section-head"><div><h2>样品成熟度</h2><p>Sample Readiness · 规则检查</p></div><Badge tone={result.ready ? "green" : "amber"}>{result.ready ? "Ready" : "Not Ready"}</Badge></div><ul className="readiness-list">{result.criteria.map((item) => <li key={item.key}><span>{item.label}</span><b className={item.ready ? "ready" : "pending"}>{item.ready ? "✓" : "!"}</b></li>)}</ul><div className="readiness-result"><strong>{result.ready ? "可进入报价 / Ready for Quotation" : "暂不可报价 / Not Ready"}</strong>{result.reasons.slice(0, 3).map((reason) => <p key={reason}>{reason}</p>)}{(result.ready || getSampleStatus(context) === "Approved") && <Button onClick={onQuotation}>创建报价 / Create Quotation →</Button>}</div></Card>;
}

export function SampleBlockers({ context }: { context: SampleContext }) {
  const blockers = getDevelopmentBlockers(context);
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>开发阻塞</h2><p>Development Blockers</p></div><Badge>{blockers.length}</Badge></div><div className="sample-blocker-list">{blockers.map((item, index) => <article key={`${item.type}-${index}`}><div><Badge>{item.type}</Badge><Badge tone={item.severity === "Blocking" ? "red" : item.severity === "Important" ? "amber" : "neutral"}>{item.severity}</Badge></div><strong>{item.reason}</strong><p>{item.action}</p><small>负责人 / Owner · {item.owner}</small></article>)}{!blockers.length && <p className="sample-empty">当前没有明显开发阻塞。</p>}</div></Card>;
}

export function SampleNextAction({ context }: { context: SampleContext }) {
  const next = getSampleNextAction(context);
  return <Card className="sample-section sample-next-card"><div className="sample-section-head"><div><h2>下一最佳行动</h2><p>Next Best Action</p></div><span className="sample-action-arrow">↗</span></div><div className="sample-next-body"><h3>{next.action}</h3><p><b>Why</b>{next.why}</p><dl><div><dt>负责人 / Owner</dt><dd>{next.owner}</dd></div><div><dt>建议时间 / Timing</dt><dd>{next.timing}</dd></div></dl></div></Card>;
}
