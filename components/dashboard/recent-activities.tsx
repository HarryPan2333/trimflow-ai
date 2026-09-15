"use client";

import { StatusBadge } from "../business/status-badge";
import type { DashboardData } from "./dashboard-data";
import { useI18n } from "../providers/language-provider";

const labels: Record<string, string> = { inquiry: "询盘", requirement: "需求", communication: "沟通", sample: "样品", quotation: "报价", negotiation: "谈判", po: "PO", contract: "合同", delivery: "交付", shipment: "出货", task: "任务" };

export function RecentActivities({ data, onOpenProject }: { data: DashboardData; onOpenProject: (project: DashboardData["projects"][number]) => void }) {
  const { language, t, label, text } = useI18n();
  const projectById = new Map(data.projects.map((item) => [item.id, item]));
  const items = [...data.timelineEvents].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 6);
  return (
    <section className="card command-section command-span-7">
      <div className="command-section-head"><div><h2>{t("dashboard.recentActivities")}</h2><p>{language === "zh" ? "跨项目时间线" : "Cross-project timeline"}</p></div><span className="section-meta">{language === "zh" ? `最近 ${items.length} 条` : `${items.length} latest`}</span></div>
      <div className="command-activity-list">
        {items.map((item) => {
          const project = projectById.get(item.projectId);
          return <button key={item.id} disabled={!project} onClick={() => project && onOpenProject(project)}><span className="activity-glyph">{item.icon}</span><div><span>{language === "zh" ? item.displayDate : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(item.occurredAt))} · {project?.code}</span><strong>{text(item.title)}</strong><p>{text(item.description)}</p></div><StatusBadge status={item.type} label={language === "zh" ? labels[item.type] ?? item.type : label(item.type)} /></button>;
        })}
      </div>
    </section>
  );
}
