"use client";

import type { DashboardKpi, SecondaryIndicator } from "./dashboard-data";
import { useI18n } from "../providers/language-provider";

type ExecutiveOverviewProps = {
  kpis: DashboardKpi[];
  indicators: SecondaryIndicator[];
  onNavigate: (target: DashboardKpi["target"]) => void;
};

export function ExecutiveOverview({ kpis, indicators, onNavigate }: ExecutiveOverviewProps) {
  const { language, t, text } = useI18n();
  return (
    <section aria-labelledby="executive-overview-title">
      <div className="command-section-title">
        <div>
          <h2 id="executive-overview-title">{t("dashboard.executiveOverview")}</h2>
          <p>{t("dashboard.executiveSubtitle")}</p>
        </div>
        <span>{t("dashboard.mockCalculated")}</span>
      </div>
      <div className="executive-kpis">
        {kpis.map((kpi) => (
          <button className="command-kpi" key={kpi.id} onClick={() => onNavigate(kpi.target)}>
            <span className="kpi-label">{language === "zh" ? kpi.label : kpi.labelEn}{language === "zh" && <small>{kpi.labelEn}</small>}</span>
            <strong>{kpi.value}</strong>
            <span className="kpi-trend">{text(kpi.trend)}</span>
            <span className="kpi-detail">{text(kpi.detail)}</span>
            <span className="kpi-link">{t("actions.view")} →</span>
          </button>
        ))}
      </div>
      <div className="secondary-indicators" aria-label={t("dashboard.additionalMetrics")}>
        {indicators.map((indicator) => (
          <div key={indicator.label}>
            <span>{text(indicator.label)}</span>
            <strong>{indicator.value}</strong>
            <small>{text(indicator.detail)}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
