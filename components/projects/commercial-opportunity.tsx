import { Badge, Card } from "../ui/primitives";
import type { ReturnTypeCommercialOpportunity } from "./project-view-types";

export function CommercialOpportunity({ opportunity }: { opportunity: ReturnTypeCommercialOpportunity }) {
  return (
    <Card className="command-detail-section opportunity-card">
      <div className="compact-section-head"><div><h2>商业机会</h2><p>Commercial Opportunity</p></div><Badge tone="blue">{opportunity.expansionPotential}</Badge></div>
      <div className="opportunity-metrics"><div><span>Estimated Value</span><strong>{opportunity.estimatedValue}</strong></div><div><span>Potential Volume</span><strong>{opportunity.potentialVolume}</strong></div><div><span>Development Depth</span><strong>{opportunity.developmentDepth}</strong></div></div>
      <div className="expansion-list"><span>Expansion / 可探索方向</span>{opportunity.expansion.map((item) => <p key={item}>＋ {item}</p>)}</div>
    </Card>
  );
}
