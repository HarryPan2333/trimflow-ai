import { Badge, Card } from "../ui/primitives";
import type { DealRisk } from "./project-command-data";
import { useI18n } from "../providers/language-provider";

const tone: Record<DealRisk["severity"], string> = { Critical: "red", High: "red", Medium: "amber", Low: "neutral" };

export function DealRisks({ risks }: { risks: DealRisk[] }) {
  const { language, t, label, text } = useI18n();
  return (
    <Card className="command-detail-section">
      <div className="compact-section-head"><div><h2>{t("project.dealRisks")}</h2><p>{language === "zh" ? "成交风险清单" : "Deal risk watchlist"}</p></div><span>{language === "zh" ? `${risks.length} 项` : `${risks.length} items`}</span></div>
      <div className="deal-risk-list">{risks.map((risk) => <article key={risk.id}><div><Badge>{label(risk.type)}</Badge><Badge tone={tone[risk.severity]}>{label(risk.severity)}</Badge></div><strong>{text(risk.reason)}</strong><p>{text(risk.action)}</p></article>)}{risks.length === 0 && <p className="command-empty compact">{language === "zh" ? "当前没有显著成交风险。" : "There are no significant deal risks."}</p>}</div>
    </Card>
  );
}
