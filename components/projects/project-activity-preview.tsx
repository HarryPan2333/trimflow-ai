"use client";

import { StatusBadge } from "../business/status-badge";
import { Card } from "../ui/primitives";
import type { TimelineEvent } from "../../lib/mock-data";
import { useI18n } from "../providers/language-provider";

export function ProjectActivityPreview({ events, owner, onViewAll }: { events: TimelineEvent[]; owner: string; onViewAll: () => void }) {
  const { language, t, label, text, formatDate } = useI18n();
  return (
    <Card className="command-detail-section">
      <div className="compact-section-head"><div><h2>{t("project.recentActivity")}</h2><p>{language === "zh" ? "关键业务动态" : "Key business updates"}</p></div><button className="text-button" onClick={onViewAll}>{language === "zh" ? "查看完整时间线" : "View full timeline"} →</button></div>
      <div className="project-activity-list">{events.slice(0, 6).map((event) => <article key={event.id}><span className="activity-glyph">{event.icon}</span><div><span>{language === "zh" ? event.displayDate : formatDate(event.occurredAt, { month: "short", day: "numeric" })} · {label(event.type)} · {event.type === "communication" ? t("common.client") : text(owner)}</span><strong>{text(event.title)}</strong><p>{text(event.description)}</p></div><StatusBadge status={event.type} /></article>)}</div>
    </Card>
  );
}
