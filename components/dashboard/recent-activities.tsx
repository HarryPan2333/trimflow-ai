"use client";

import { StatusBadge } from "../business/status-badge";
import type { DashboardData } from "./dashboard-data";

const labels: Record<string, string> = { inquiry: "询盘", requirement: "需求", communication: "沟通", sample: "样品", quotation: "报价", negotiation: "谈判", po: "PO", contract: "合同", delivery: "交付", shipment: "出货", task: "任务" };

export function RecentActivities({ data, onOpenProject }: { data: DashboardData; onOpenProject: (project: DashboardData["projects"][number]) => void }) {
  const projectById = new Map(data.projects.map((item) => [item.id, item]));
  const items = [...data.timelineEvents].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 6);
  return (
    <section className="card command-section command-span-7">
      <div className="command-section-head"><div><h2>最近业务活动</h2><p>Recent Activities · 跨项目时间线</p></div><span className="section-meta">最近 {items.length} 条</span></div>
      <div className="command-activity-list">
        {items.map((item) => {
          const project = projectById.get(item.projectId);
          return <button key={item.id} disabled={!project} onClick={() => project && onOpenProject(project)}><span className="activity-glyph">{item.icon}</span><div><span>{item.displayDate} · {project?.code}</span><strong>{item.title}</strong><p>{item.description}</p></div><StatusBadge status={item.type} label={labels[item.type] ?? item.type} /></button>;
        })}
      </div>
    </section>
  );
}
