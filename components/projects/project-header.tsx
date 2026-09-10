"use client";

import { HealthBadge } from "../business/health-badge";
import { Button } from "../ui/primitives";
import type { ProjectStage } from "../../lib/mock-data";
import type { OpportunityPriority, ProjectCommandData } from "./project-command-data";

type ProjectHeaderProps = {
  data: ProjectCommandData;
  priority: OpportunityPriority;
  expectedValue: string;
  stages: ProjectStage[];
  onBack: () => void;
  onUpdateStage: (stage: ProjectStage) => void;
  onAddActivity: () => void;
  onCreateSample: () => void;
  onCreateQuote: () => void;
  onEditProject: () => void;
};

export function ProjectHeader({ data, priority, expectedValue, stages, onBack, onUpdateStage, onAddActivity, onCreateSample, onCreateQuote, onEditProject }: ProjectHeaderProps) {
  const { project, client } = data;
  return (
    <header className="project-command-header">
      <button className="back-link" onClick={onBack}>‹ 返回销售项目</button>
      <div className="project-command-title-row">
        <div className="project-command-title">
          <span className="client-avatar large" style={{ background: project.color }}>{project.initials}</span>
          <div><span className="project-code">{project.code} · Project Command Center</span><h1>{project.name}</h1><p>{client?.name ?? project.customer} · {project.region}</p></div>
        </div>
        <div className="project-command-actions">
          <Button variant="secondary" onClick={onAddActivity}>＋ 添加活动</Button>
          <Button variant="secondary" onClick={onCreateSample}>创建样品</Button>
          <Button variant="secondary" onClick={onCreateQuote}>创建报价</Button>
          <Button onClick={onEditProject}>编辑项目</Button>
        </div>
      </div>
      <div className="project-command-facts">
        <div><span>Client / Brand</span><strong>{project.customer}</strong></div>
        <div><span>Owner</span><strong>{project.owner}</strong></div>
        <div><span>Current Stage</span><select value={project.stage} onChange={(event) => onUpdateStage(event.target.value as ProjectStage)}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></div>
        <div><span>Health Status</span><HealthBadge status={project.health} className="project-health" /></div>
        <div title={priority.reason}><span>Opportunity Priority</span><strong className={`opportunity-priority priority-${priority.level.toLowerCase()}`}>{priority.level} · {priority.label}</strong></div>
        <div><span>Last Contact</span><strong>{client?.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString("zh-CN") : "当前项目材料中尚未确认"}</strong></div>
        <div><span>Next Action</span><strong>{project.next}</strong></div>
        <div><span>Expected Opportunity Value</span><strong>{expectedValue}</strong></div>
      </div>
    </header>
  );
}
