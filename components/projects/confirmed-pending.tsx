import { Badge, Card } from "../ui/primitives";
import type { ReturnTypeConfirmedPending } from "./project-view-types";

const impactTone: Record<string, string> = { High: "red", Medium: "amber", Low: "neutral" };

export function ConfirmedPending({ information }: { information: ReturnTypeConfirmedPending }) {
  return (
    <div className="confirmed-pending-grid">
      <Card className="command-detail-section confirmed-panel">
        <div className="compact-section-head"><div><h2>已确认</h2><p>Confirmed Information</p></div><Badge tone="green">{information.confirmed.length} 项</Badge></div>
        <div className="command-list">{information.confirmed.map((item) => <div key={item.id}><span className="status-symbol">✓</span><p><strong>{item.field}</strong><span>{item.value}</span></p></div>)}</div>
      </Card>
      <Card className="command-detail-section pending-panel">
        <div className="compact-section-head"><div><h2>待确认</h2><p>Pending · 按商业影响排序</p></div><Badge tone="amber">{information.pending.length} 项</Badge></div>
        <div className="command-list">{information.pending.map((item) => <div key={item.id}><span className="status-symbol">?</span><p><strong>{item.field}</strong><span>{item.value}</span></p><Badge tone={impactTone[item.impact]}>{item.impact}</Badge></div>)}</div>
      </Card>
    </div>
  );
}
