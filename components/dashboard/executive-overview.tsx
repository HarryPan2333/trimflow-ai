"use client";

import type { DashboardKpi, SecondaryIndicator } from "./dashboard-data";

type ExecutiveOverviewProps = {
  kpis: DashboardKpi[];
  indicators: SecondaryIndicator[];
  onNavigate: (target: DashboardKpi["target"]) => void;
};

export function ExecutiveOverview({ kpis, indicators, onNavigate }: ExecutiveOverviewProps) {
  return (
    <section aria-labelledby="executive-overview-title">
      <div className="command-section-title">
        <div>
          <h2 id="executive-overview-title">经营概览</h2>
          <p>Executive Overview · 关键销售节点实时汇总</p>
        </div>
        <span>基于当前 Mock Data 计算</span>
      </div>
      <div className="executive-kpis">
        {kpis.map((kpi) => (
          <button className="command-kpi" key={kpi.id} onClick={() => onNavigate(kpi.target)}>
            <span className="kpi-label">{kpi.label}<small>{kpi.labelEn}</small></span>
            <strong>{kpi.value}</strong>
            <span className="kpi-trend">{kpi.trend}</span>
            <span className="kpi-detail">{kpi.detail}</span>
            <span className="kpi-link">查看相关业务 →</span>
          </button>
        ))}
      </div>
      <div className="secondary-indicators" aria-label="补充经营指标">
        {indicators.map((indicator) => (
          <div key={indicator.label}>
            <span>{indicator.label}</span>
            <strong>{indicator.value}</strong>
            <small>{indicator.detail}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
