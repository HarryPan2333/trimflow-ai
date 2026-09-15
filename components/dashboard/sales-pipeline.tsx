"use client";

import { useState } from "react";
import { StatusBadge } from "../business/status-badge";
import type { Project } from "../../lib/mock-data";
import type { getPipelineCounts } from "./dashboard-data";
import { useI18n } from "../providers/language-provider";

type PipelineStages = ReturnType<typeof getPipelineCounts>;

export function SalesPipeline({ stages, onOpenProject }: { stages: PipelineStages; onOpenProject: (project: Project) => void }) {
  const { language, t } = useI18n();
  const [selected, setSelected] = useState(stages[0]?.id ?? "inquiry");
  const current = stages.find((stage) => stage.id === selected) ?? stages[0];

  return (
    <section className="card command-section command-span-12">
      <div className="command-section-head">
        <div><h2>{t("dashboard.pipeline")}</h2><p>{t("dashboard.pipelineSubtitle")}</p></div>
        <span className="section-meta">{t("dashboard.projectsCount", { count: stages.reduce((sum, stage) => sum + stage.projects.length, 0) })}</span>
      </div>
      <div className="pipeline-scroll">
        <div className="command-pipeline" role="tablist" aria-label={t("dashboard.pipeline")}>
          {stages.map((stage, index) => (
            <button key={stage.id} className={selected === stage.id ? "active" : ""} onClick={() => setSelected(stage.id)} role="tab" aria-selected={selected === stage.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{language === "zh" ? stage.labelZh : stage.label}</strong>
              {language === "zh" && <small>{stage.label}</small>}
              <b>{stage.projects.length}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="pipeline-results">
        <span className="pipeline-filter-label">{language === "zh" ? "当前筛选" : "Current Filter"}：{language === "zh" ? current?.labelZh : current?.label}</span>
        <div>
          {current?.projects.map((project) => (
            <button key={project.id} onClick={() => onOpenProject(project)}>
              <span>{project.code}</span><strong>{project.customer}</strong><StatusBadge status={project.stage} />
            </button>
          ))}
          {current?.projects.length === 0 && <span className="command-empty compact">{language === "zh" ? "当前阶段暂无项目" : "No projects in this stage"}</span>}
        </div>
      </div>
    </section>
  );
}
