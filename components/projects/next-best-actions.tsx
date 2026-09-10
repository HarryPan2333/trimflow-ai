import { Card } from "../ui/primitives";
import type { NextBestAction } from "./project-command-data";

export function NextBestActions({ actions }: { actions: NextBestAction[] }) {
  return (
    <Card className="command-detail-section next-best-card">
      <div className="compact-section-head"><div><h2>下一最佳行动</h2><p>Next Best Actions</p></div><span>最多 3 项</span></div>
      <div className="next-best-list">{actions.map((item, index) => <article key={item.id}><span>{index + 1}</span><div><strong>{item.action}</strong><p><b>Why</b>{item.why}</p><small>{item.owner} · {item.timing}</small></div></article>)}</div>
    </Card>
  );
}
