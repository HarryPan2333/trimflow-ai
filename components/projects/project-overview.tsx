"use client";

import { Badge, Card } from "../ui/primitives";
import { CommercialOpportunity } from "./commercial-opportunity";
import { ConfirmedPending } from "./confirmed-pending";
import { DealRisks } from "./deal-risks";
import { DealStrategy } from "./deal-strategy";
import { NextBestActions } from "./next-best-actions";
import { ProjectActivityPreview } from "./project-activity-preview";
import { StakeholderCoverage } from "./stakeholder-coverage";
import { StakeholderMap } from "./stakeholder-map";
import {
  getCommercialOpportunity,
  getConfirmedPending,
  getCurrentSituation,
  getDealRisks,
  getDealStrategy,
  getNextBestActions,
  getStageSensitiveFollowUp,
  getStakeholderCoverage,
} from "./project-command-data";
import type { ProjectCommandData } from "./project-command-data";
import { useI18n } from "../providers/language-provider";

export function ProjectOverview({ data, events, onViewTimeline }: { data: ProjectCommandData; events: ProjectCommandData["timeline"]; onViewTimeline: () => void }) {
  const { language, t, text } = useI18n();
  const situation = getCurrentSituation(data, language);
  const followUp = getStageSensitiveFollowUp(data, language);
  return (
    <div className="project-overview-grid">
      <div className="project-execution-column">
        <Card className="command-detail-section situation-card">
          <div className="compact-section-head"><div><h2>{t("project.currentSituation")}</h2><p>{language === "zh" ? "用于本轮销售判断" : "For the current sales decision"}</p></div><Badge tone={followUp.attention ? "amber" : "green"}>{followUp.cadence}</Badge></div>
          <div className="situation-grid">
            <div><span>{t("common.currentStage")}</span><strong>{text(situation.stage)}</strong></div>
            <div><span>{language === "zh" ? "最新进展" : "Latest Development"}</span><strong>{text(situation.latest)}</strong></div>
            <div><span>{language === "zh" ? "最近客户信号" : "Last Customer Signal"}</span><strong>{text(situation.signal)}</strong></div>
            <div><span>{language === "zh" ? "当前商务位置" : "Current Commercial Position"}</span><strong>{text(situation.commercial)}</strong></div>
          </div>
          <p className={`follow-up-note${followUp.attention ? " attention" : ""}`}><b>{language === "zh" ? "跟进规则" : "Follow-up Rule"}</b>{text(followUp.reason)}</p>
        </Card>
        <ConfirmedPending information={getConfirmedPending(data)} />
        <StakeholderMap contacts={data.contacts} />
        <ProjectActivityPreview events={events} owner={data.project.owner} onViewAll={onViewTimeline} />
      </div>
      <aside className="project-strategy-rail">
        <CommercialOpportunity opportunity={getCommercialOpportunity(data, language)} />
        <DealStrategy strategy={getDealStrategy(data, language)} />
        <StakeholderCoverage coverage={getStakeholderCoverage(data, language)} />
        <DealRisks risks={getDealRisks(data, language)} />
        <NextBestActions actions={getNextBestActions(data, language)} />
      </aside>
    </div>
  );
}
