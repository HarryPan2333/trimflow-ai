"use client";

import { useState } from "react";
import { StatusBadge } from "../business/status-badge";
import type { Project } from "../../lib/mock-data";
import type { getPipelineCounts } from "./dashboard-data";

type PipelineStages = ReturnType<typeof getPipelineCounts>;

export function SalesPipeline({ stages, onOpenProject }: { stages: PipelineStages; onOpenProject: (project: Project) => void }) {
  const [selected, setSelected] = useState(stages[0]?.id ?? "inquiry");
  const current = stages.find((stage) => stage.id === selected) ?? stages[0];

  return (
    <section className="card command-section command-span-12">
      <div className="command-section-head">
        <div><h2>销售 Pipeline</h2><p>Sales Pipeline · 点击阶段筛选当前工作台</p></div>
        <span className="section-meta">{stages.reduce((sum, stage) => sum + stage.projects.length, 0)} 个项目</span>
      </div>
      <div className="pipeline-scroll">
        <div className="command-pipeline" role="tablist" aria-label="销售阶段筛选">
          {stages.map((stage, index) => (
            <button key={stage.id} className={selected === stage.id ? "active" : ""} onClick={() => setSelected(stage.id)} role="tab" aria-selected={selected === stage.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{stage.label}</strong>
              <small>{stage.labelZh}</small>
              <b>{stage.projects.length}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="pipeline-results">
        <span className="pipeline-filter-label">当前筛选：{current?.labelZh}</span>
        <div>
          {current?.projects.map((project) => (
            <button key={project.id} onClick={() => onOpenProject(project)}>
              <span>{project.code}</span><strong>{project.customer}</strong><StatusBadge status={project.stage} />
            </button>
          ))}
          {current?.projects.length === 0 && <span className="command-empty compact">当前阶段暂无项目</span>}
        </div>
      </div>
    </section>
  );
}
