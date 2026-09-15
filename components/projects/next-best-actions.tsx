import { Card } from "../ui/primitives";
import type { NextBestAction } from "./project-command-data";
import { useI18n } from "../providers/language-provider";

export function NextBestActions({ actions }: { actions: NextBestAction[] }) {
  const { language, t, text } = useI18n();
  return (
    <Card className="command-detail-section next-best-card">
      <div className="compact-section-head"><div><h2>{t("project.nextBestActions")}</h2><p>{language === "zh" ? "按优先级排序" : "Ranked by priority"}</p></div><span>{language === "zh" ? "最多 3 项" : "Up to 3 items"}</span></div>
      <div className="next-best-list">{actions.map((item, index) => <article key={item.id}><span>{index + 1}</span><div><strong>{text(item.action)}</strong><p><b>{language === "zh" ? "原因" : "Why"}</b>{text(item.why)}</p><small>{text(item.owner)} · {text(item.timing)}</small></div></article>)}</div>
    </Card>
  );
}
