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

export function ProjectOverview({ data, events, onViewTimeline }: { data: ProjectCommandData; events: ProjectCommandData["timeline"]; onViewTimeline: () => void }) {
  const situation = getCurrentSituation(data);
  const followUp = getStageSensitiveFollowUp(data);
  return (
    <div className="project-overview-grid">
      <div className="project-execution-column">
        <Card className="command-detail-section situation-card">
          <div className="compact-section-head"><div><h2>当前态势</h2><p>Current Situation · 用于本轮销售判断</p></div><Badge tone={followUp.attention ? "amber" : "green"}>{followUp.cadence}</Badge></div>
          <div className="situation-grid">
            <div><span>Current Stage</span><strong>{situation.stage}</strong></div>
            <div><span>Latest Development</span><strong>{situation.latest}</strong></div>
            <div><span>Last Customer Signal</span><strong>{situation.signal}</strong></div>
            <div><span>Current Commercial Position</span><strong>{situation.commercial}</strong></div>
          </div>
          <p className={`follow-up-note${followUp.attention ? " attention" : ""}`}><b>Follow-up Rule</b>{followUp.reason}</p>
        </Card>
        <ConfirmedPending information={getConfirmedPending(data)} />
        <StakeholderMap contacts={data.contacts} />
        <ProjectActivityPreview events={events} owner={data.project.owner} onViewAll={onViewTimeline} />
      </div>
      <aside className="project-strategy-rail">
        <CommercialOpportunity opportunity={getCommercialOpportunity(data)} />
        <DealStrategy strategy={getDealStrategy(data)} />
        <StakeholderCoverage coverage={getStakeholderCoverage(data)} />
        <DealRisks risks={getDealRisks(data)} />
        <NextBestActions actions={getNextBestActions(data)} />
      </aside>
    </div>
  );
}
