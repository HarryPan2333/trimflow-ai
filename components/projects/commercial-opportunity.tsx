import { Badge, Card } from "../ui/primitives";
import type { ReturnTypeCommercialOpportunity } from "./project-view-types";
import { useI18n } from "../providers/language-provider";

export function CommercialOpportunity({ opportunity }: { opportunity: ReturnTypeCommercialOpportunity }) {
  const { language, t, text } = useI18n();
  return (
    <Card className="command-detail-section opportunity-card">
      <div className="compact-section-head"><div><h2>{t("project.commercialOpportunity")}</h2><p>Commercial Opportunity</p></div><Badge tone="blue">{text(opportunity.expansionPotential)}</Badge></div>
      <div className="opportunity-metrics"><div><span>{language === "zh" ? "预计金额" : "Estimated Value"}</span><strong>{opportunity.estimatedValue}</strong></div><div><span>{language === "zh" ? "潜在数量" : "Potential Volume"}</span><strong>{opportunity.potentialVolume}</strong></div><div><span>{language === "zh" ? "开发深度" : "Development Depth"}</span><strong>{text(opportunity.developmentDepth)}</strong></div></div>
      <div className="expansion-list"><span>{language === "zh" ? "可探索方向" : "Expansion Opportunities"}</span>{opportunity.expansion.map((item) => <p key={item}>＋ {text(item)}</p>)}</div>
    </Card>
  );
}
