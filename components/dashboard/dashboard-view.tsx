"use client";

import { PageHeader } from "../layout/page-header";
import { Button } from "../ui/primitives";
import {
  clients, communications, deliveries, projectRequirements, purchaseOrders,
  quotations, sampleVersions, samples, shipments, tasks, timelineEvents,
} from "../../lib/mock-data";
import type { Project } from "../../lib/mock-data";
import { AccountPortfolio } from "./account-portfolio";
import { ExecutiveOverview } from "./executive-overview";
import { MarketIntelligence } from "./market-intelligence";
import { RecentActivities } from "./recent-activities";
import { SalesInsight } from "./sales-insight";
import { SalesPerformance } from "./sales-performance";
import { SalesPipeline } from "./sales-pipeline";
import { TodayFocus } from "./today-focus";
import { getDashboardKpis, getPipelineCounts, getSecondaryIndicators, getTodayFocus } from "./dashboard-data";
import type { DashboardData, DashboardKpi } from "./dashboard-data";

type DashboardViewProps = {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onNavigate: (target: DashboardKpi["target"]) => void;
  onOpenNewProject: () => void;
};

export function DashboardView({ projects, onOpenProject, onNavigate, onOpenNewProject }: DashboardViewProps) {
  const data: DashboardData = { projects, clients, requirements: projectRequirements, samples, sampleVersions, quotations, purchaseOrders, deliveries, shipments, communications, tasks, timelineEvents };
  return (
    <div className="command-dashboard">
      <PageHeader title="销售作战台" subtitle="Sales Command Center · 聚焦今日动作、Pipeline 与客户经营节奏。" actions={<><Button variant="secondary" onClick={() => onNavigate("projects")}>查看销售项目</Button><Button onClick={onOpenNewProject}>＋ 新建项目</Button></>} />
      <ExecutiveOverview kpis={getDashboardKpis(data)} indicators={getSecondaryIndicators(data)} onNavigate={onNavigate} />
      <div className="command-grid command-section-gap">
        <TodayFocus items={getTodayFocus(data)} onOpenProject={onOpenProject} />
        <AccountPortfolio data={data} onOpenProject={onOpenProject} />
        <SalesPipeline stages={getPipelineCounts(data)} onOpenProject={onOpenProject} />
        <SalesPerformance data={data} />
        <MarketIntelligence />
        <RecentActivities data={data} onOpenProject={onOpenProject} />
        <SalesInsight data={data} />
      </div>
    </div>
  );
}
