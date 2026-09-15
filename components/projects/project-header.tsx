"use client";

import { HealthBadge } from "../business/health-badge";
import { Button } from "../ui/primitives";
import type { ProjectStage } from "../../lib/mock-data";
import type { OpportunityPriority, ProjectCommandData } from "./project-command-data";
import { useI18n } from "../providers/language-provider";

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
  const { t, label, text, formatDate } = useI18n();
  const { project, client } = data;
  return (
    <header className="project-command-header">
      <button className="back-link" onClick={onBack}>‹ {t("project.back")}</button>
      <div className="project-command-title-row">
        <div className="project-command-title">
          <span className="client-avatar large" style={{ background: project.color }}>{project.initials}</span>
          <div><span className="project-code">{project.code} · {t("project.commandCenter")}</span><h1>{text(project.name)}</h1><p>{text(client?.name ?? project.customer)} · {text(project.region)}</p></div>
        </div>
        <div className="project-command-actions">
          <Button variant="secondary" onClick={onAddActivity}>＋ {t("project.addActivity")}</Button>
          <Button variant="secondary" onClick={onCreateSample}>{t("project.createSample")}</Button>
          <Button variant="secondary" onClick={onCreateQuote}>{t("project.createQuote")}</Button>
          <Button onClick={onEditProject}>{t("project.edit")}</Button>
        </div>
      </div>
      <div className="project-command-facts">
        <div><span>{t("project.clientBrand")}</span><strong>{text(project.customer)}</strong></div>
        <div><span>{t("common.owner")}</span><strong>{text(project.owner)}</strong></div>
        <div><span>{t("common.currentStage")}</span><select value={project.stage} onChange={(event) => onUpdateStage(event.target.value as ProjectStage)}>{stages.map((stage) => <option key={stage} value={stage}>{label(stage)}</option>)}</select></div>
        <div><span>{t("project.health")}</span><HealthBadge status={project.health} className="project-health" /></div>
        <div title={text(priority.reason)}><span>{t("project.priority")}</span><strong className={`opportunity-priority priority-${priority.level.toLowerCase()}`}>{priority.level} · {text(priority.label)}</strong></div>
        <div><span>{t("common.lastContact")}</span><strong>{client?.lastContactAt ? formatDate(client.lastContactAt) : t("common.notConfirmed")}</strong></div>
        <div><span>{t("common.nextAction")}</span><strong>{text(project.next)}</strong></div>
        <div><span>{t("project.expectedValue")}</span><strong>{expectedValue}</strong></div>
      </div>
    </header>
  );
}
