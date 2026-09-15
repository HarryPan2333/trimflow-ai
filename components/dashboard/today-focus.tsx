"use client";

import { Badge } from "../ui/primitives";
import type { FocusItem } from "./dashboard-data";
import { useI18n } from "../providers/language-provider";

export function TodayFocus({ items, onOpenProject }: { items: FocusItem[]; onOpenProject: (project: FocusItem["project"]) => void }) {
  const { language, t, label, text } = useI18n();
  return (
    <section className="card command-section command-span-8">
      <div className="command-section-head">
        <div><h2>{t("dashboard.todayFocus")}</h2><p>{t("dashboard.focusSubtitle")}</p></div>
        <Badge tone={items.some((item) => item.priority === "高") ? "red" : "neutral"}>{t("dashboard.itemsPending", { count: items.length })}</Badge>
      </div>
      <div className="focus-command-list">
        {items.map((item) => (
          <button className="focus-command-item" key={item.id} onClick={() => onOpenProject(item.project)}>
            <Badge tone={item.priority === "高" ? "red" : item.priority === "中" ? "amber" : "blue"}>{label(item.priority)} {language === "zh" ? "优先级" : "Priority"}</Badge>
            <div className="focus-command-main">
              <span>{item.client} · {item.project.code}</span>
              <strong>{text(item.issue)}</strong>
              <p>{text(item.reason)}</p>
            </div>
            <div className="focus-command-action"><span>{language === "zh" ? "建议动作" : "Recommended Action"}</span><strong>{text(item.action)}</strong></div>
            <span className="command-arrow">›</span>
          </button>
        ))}
        {items.length === 0 && <p className="command-empty">{language === "zh" ? "今天没有需要优先处理的异常事项。" : "There are no priority exceptions today."}</p>}
      </div>
    </section>
  );
}
