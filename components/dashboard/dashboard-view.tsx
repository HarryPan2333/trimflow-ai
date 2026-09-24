"use client";

import { PageHeader } from "../layout/page-header";
import { Button, Card } from "../ui/primitives";
import {
  clients, communications, deliveries, projectRequirements, purchaseOrders,
  quotations, sampleVersions, samples, shipments, timelineEvents,
} from "../../lib/mock-data";
import type { Project } from "../../lib/mock-data";
import type { AccountState } from "../../lib/accounts/types";
import { getLegacyClients } from "../../lib/accounts/legacy-adapter";
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
import type { WorkspaceTask } from "../../lib/tasks/workspace";

type DashboardViewProps = {
  projects: Project[];
  accountState?: AccountState;
  onOpenProject: (project: Project) => void;
  onNavigate: (target: DashboardKpi["target"]) => void;
  onOpenNewProject: () => void;
  sharedTasks: WorkspaceTask[];
  reportableToday: number;
  dailyReportStatus?: "draft" | "reviewed" | "final";
  weeklyReportStatus?: "draft" | "reviewed" | "final";
  onOpenReports: () => void;
};

export function DashboardView({ projects, accountState, sharedTasks, reportableToday, dailyReportStatus, weeklyReportStatus, onOpenReports, onOpenProject, onNavigate, onOpenNewProject }: DashboardViewProps) {
  const { language, t } = useI18n();
  const data: DashboardData = { projects, clients: accountState ? getLegacyClients(accountState) : clients, requirements: projectRequirements, samples, sampleVersions, quotations, purchaseOrders, deliveries, shipments, communications, tasks: sharedTasks, timelineEvents };
  return (
    <div className="command-dashboard">
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} actions={<><Button variant="secondary" onClick={() => onNavigate("projects")}>{t("dashboard.viewProjects")}</Button><Button onClick={onOpenNewProject}>＋ {t("actions.createProject")}</Button></>} />
      <Card className="report-bridge"><div><h3>{t("report.reportableToday")}: {reportableToday} · {t("tasks.weekTotal")}: {sharedTasks.filter((item) => item.status !== "已完成").length}</h3><p>{t("report.dailyStatus")}: {dailyReportStatus ? t(`report.${dailyReportStatus}`) : t("report.noStatus")} · {t("report.weeklyStatus")}: {weeklyReportStatus ? t(`report.${weeklyReportStatus}`) : t("report.noStatus")}</p></div><Button variant="secondary" onClick={onOpenReports}>{t("report.openReports")} →</Button></Card>
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
