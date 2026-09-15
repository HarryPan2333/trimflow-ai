import { Badge, Card } from "../ui/primitives";
import type { ReturnTypeConfirmedPending } from "./project-view-types";
import { useI18n } from "../providers/language-provider";

const impactTone: Record<string, string> = { High: "red", Medium: "amber", Low: "neutral" };

export function ConfirmedPending({ information }: { information: ReturnTypeConfirmedPending }) {
  const { language, t, label, text } = useI18n();
  return (
    <div className="confirmed-pending-grid">
      <Card className="command-detail-section confirmed-panel">
        <div className="compact-section-head"><div><h2>{t("project.confirmed")}</h2><p>{language === "zh" ? "确认信息" : "Confirmed Information"}</p></div><Badge tone="green">{language === "zh" ? `${information.confirmed.length} 项` : `${information.confirmed.length} items`}</Badge></div>
        <div className="command-list">{information.confirmed.map((item) => <div key={item.id}><span className="status-symbol">✓</span><p><strong>{label(item.field)}</strong><span>{text(item.value)}</span></p></div>)}</div>
      </Card>
      <Card className="command-detail-section pending-panel">
        <div className="compact-section-head"><div><h2>{t("project.pending")}</h2><p>{language === "zh" ? "按商业影响排序" : "Sorted by commercial impact"}</p></div><Badge tone="amber">{language === "zh" ? `${information.pending.length} 项` : `${information.pending.length} items`}</Badge></div>
        <div className="command-list">{information.pending.map((item) => <div key={item.id}><span className="status-symbol">?</span><p><strong>{label(item.field)}</strong><span>{text(item.value)}</span></p><Badge tone={impactTone[item.impact]}>{label(item.impact)}</Badge></div>)}</div>
      </Card>
    </div>
  );
}
