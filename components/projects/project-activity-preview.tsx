"use client";

import { StatusBadge } from "../business/status-badge";
import { Card } from "../ui/primitives";
import type { TimelineEvent } from "../../lib/mock-data";

export function ProjectActivityPreview({ events, owner, onViewAll }: { events: TimelineEvent[]; owner: string; onViewAll: () => void }) {
  return (
    <Card className="command-detail-section">
      <div className="compact-section-head"><div><h2>最近活动</h2><p>Recent Activity</p></div><button className="text-button" onClick={onViewAll}>查看完整时间线 →</button></div>
      <div className="project-activity-list">{events.slice(0, 6).map((event) => <article key={event.id}><span className="activity-glyph">{event.icon}</span><div><span>{event.displayDate} · {event.type} · {event.type === "communication" ? "客户 / Client" : owner}</span><strong>{event.title}</strong><p>{event.description}</p></div><StatusBadge status={event.type} /></article>)}</div>
    </Card>
  );
}
