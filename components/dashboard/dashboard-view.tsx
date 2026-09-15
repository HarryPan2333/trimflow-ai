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
import { useI18n } from "../providers/language-provider";

type DashboardViewProps = {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onNavigate: (target: DashboardKpi["target"]) => void;
  onOpenNewProject: () => void;
};

export function DashboardView({ projects, onOpenProject, onNavigate, onOpenNewProject }: DashboardViewProps) {
  const { language, t } = useI18n();
  const data: DashboardData = { projects, clients, requirements: projectRequirements, samples, sampleVersions, quotations, purchaseOrders, deliveries, shipments, communications, tasks, timelineEvents };
  return (
    <div className="command-dashboard">
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} actions={<><Button variant="secondary" onClick={() => onNavigate("projects")}>{t("dashboard.viewProjects")}</Button><Button onClick={onOpenNewProject}>＋ {t("actions.createProject")}</Button></>} />
      <ExecutiveOverview kpis={getDashboardKpis(data, language)} indicators={getSecondaryIndicators(data, language)} onNavigate={onNavigate} />
      <div className="command-grid command-section-gap">
        <TodayFocus items={getTodayFocus(data, language)} onOpenProject={onOpenProject} />
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
