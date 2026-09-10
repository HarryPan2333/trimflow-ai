import { Badge, Card } from "../ui/primitives";
import type { DealRisk } from "./project-command-data";

const tone: Record<DealRisk["severity"], string> = { Critical: "red", High: "red", Medium: "amber", Low: "neutral" };

export function DealRisks({ risks }: { risks: DealRisk[] }) {
  return (
    <Card className="command-detail-section">
      <div className="compact-section-head"><div><h2>成交风险</h2><p>Deal Risks</p></div><span>{risks.length} 项</span></div>
      <div className="deal-risk-list">{risks.map((risk) => <article key={risk.id}><div><Badge>{risk.type}</Badge><Badge tone={tone[risk.severity]}>{risk.severity}</Badge></div><strong>{risk.reason}</strong><p>{risk.action}</p></article>)}{risks.length === 0 && <p className="command-empty compact">当前没有显著成交风险。</p>}</div>
    </Card>
  );
}
