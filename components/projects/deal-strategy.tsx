import { Badge, Card } from "../ui/primitives";
import type { ReturnTypeDealStrategy } from "./project-view-types";

export function DealStrategy({ strategy }: { strategy: ReturnTypeDealStrategy }) {
  return (
    <Card className="strategy-card command-detail-section">
      <div className="compact-section-head"><div><h2>成交策略</h2><p>Deal Strategy</p></div><Badge tone="purple">Prototype Sales Strategy</Badge></div>
      <div className="strategy-body">
        <div className="strategy-type"><span>Customer Type</span><strong>{strategy.clientType}</strong></div>
        <div><span className="rail-label">Winning Thesis</span><ul>{strategy.thesis.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><span className="rail-label">Decision Criteria</span><div className="criteria-list">{strategy.criteria.map((item) => <Badge key={item}>{item}</Badge>)}</div></div>
        <div className="strategy-guardrails"><p><span>Lead With</span><strong>{strategy.leadWith}</strong></p><p><span>Avoid</span><strong>{strategy.avoid}</strong></p></div>
      </div>
    </Card>
  );
}
