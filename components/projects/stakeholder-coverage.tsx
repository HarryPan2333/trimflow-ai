import { Badge, Card } from "../ui/primitives";
import type { ReturnTypeStakeholderCoverage } from "./project-view-types";
import { useI18n } from "../providers/language-provider";

export function StakeholderCoverage({ coverage }: { coverage: ReturnTypeStakeholderCoverage }) {
  const { language, t, label, text } = useI18n();
  return (
    <Card className="command-detail-section">
      <div className="compact-section-head"><div><h2>{t("project.stakeholderCoverage")}</h2><p>{language === "zh" ? "关键角色覆盖" : "Key role coverage"}</p></div><Badge tone={coverage.level === "High" ? "red" : coverage.level === "Medium" ? "amber" : "green"}>{label(coverage.level)} {language === "zh" ? "风险" : "Risk"}</Badge></div>
      <div className="coverage-list">{coverage.checks.map((item) => <div key={item.label}><span className={item.covered ? "covered" : "missing"}>{item.covered ? "✓" : "!"}</span><p><strong>{text(item.label)}</strong><small>{text(item.reason)}</small></p></div>)}</div>
    </Card>
  );
}
