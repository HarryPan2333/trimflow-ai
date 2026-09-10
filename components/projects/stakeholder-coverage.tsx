import { Badge, Card } from "../ui/primitives";
import type { ReturnTypeStakeholderCoverage } from "./project-view-types";

export function StakeholderCoverage({ coverage }: { coverage: ReturnTypeStakeholderCoverage }) {
  return (
    <Card className="command-detail-section">
      <div className="compact-section-head"><div><h2>关键人覆盖</h2><p>Stakeholder Coverage</p></div><Badge tone={coverage.level === "High" ? "red" : coverage.level === "Medium" ? "amber" : "green"}>{coverage.level} Risk</Badge></div>
      <div className="coverage-list">{coverage.checks.map((item) => <div key={item.label}><span className={item.covered ? "covered" : "missing"}>{item.covered ? "✓" : "!"}</span><p><strong>{item.label}</strong><small>{item.reason}</small></p></div>)}</div>
    </Card>
  );
}
