"use client";

import { HealthBadge } from "../business/health-badge";
import { StatusBadge } from "../business/status-badge";
import type { DashboardData } from "./dashboard-data";

const strategies: Record<string, string> = { "client-nas": "Grow", "client-efc": "Maintain / Grow", "client-eyw": "Develop" };

export function AccountPortfolio({ data, onOpenProject }: { data: DashboardData; onOpenProject: (project: DashboardData["projects"][number]) => void }) {
  return (
    <section className="card command-section command-span-4">
      <div className="command-section-head"><div><h2>客户组合</h2><p>Account Portfolio · 客户经营策略</p></div></div>
      <div className="portfolio-list">
        {data.clients.map((client) => {
          const project = data.projects.find((item) => item.clientId === client.id);
          if (!project) return null;
          return (
            <button key={client.id} onClick={() => onOpenProject(project)}>
              <div className="portfolio-top"><span>{client.code}</span><b>{strategies[client.id] ?? "Develop"}</b></div>
              <strong>{client.name}</strong>
              <div className="portfolio-badges"><StatusBadge status={project.stage} /><HealthBadge status={project.health} /></div>
              <p><span>机会</span>{project.quantity}</p>
              <p><span>风险</span>{project.risks[0] ?? "当前无显著风险"}</p>
              <p><span>下一步</span>{project.next}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
