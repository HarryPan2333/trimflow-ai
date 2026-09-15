import { Badge, Card } from "../ui/primitives";
import type { ReturnTypeDealStrategy } from "./project-view-types";
import { useI18n } from "../providers/language-provider";

export function DealStrategy({ strategy }: { strategy: ReturnTypeDealStrategy }) {
  const { language, t, text } = useI18n();
  return (
    <Card className="strategy-card command-detail-section">
      <div className="compact-section-head"><div><h2>{t("project.dealStrategy")}</h2><p>Deal Strategy</p></div><Badge tone="purple">{language === "zh" ? "原型销售策略" : "Prototype Sales Strategy"}</Badge></div>
      <div className="strategy-body">
        <div className="strategy-type"><span>{language === "zh" ? "客户类型" : "Customer Type"}</span><strong>{text(strategy.clientType)}</strong></div>
        <div><span className="rail-label">{language === "zh" ? "成交主张" : "Winning Thesis"}</span><ul>{strategy.thesis.map((item) => <li key={item}>{text(item)}</li>)}</ul></div>
        <div><span className="rail-label">{language === "zh" ? "决策标准" : "Decision Criteria"}</span><div className="criteria-list">{strategy.criteria.map((item) => <Badge key={item}>{text(item)}</Badge>)}</div></div>
        <div className="strategy-guardrails"><p><span>{language === "zh" ? "重点强调" : "Lead With"}</span><strong>{text(strategy.leadWith)}</strong></p><p><span>{language === "zh" ? "避免" : "Avoid"}</span><strong>{text(strategy.avoid)}</strong></p></div>
      </div>
    </Card>
  );
}
