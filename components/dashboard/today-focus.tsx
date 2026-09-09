"use client";

import { Badge } from "../ui/primitives";
import type { FocusItem } from "./dashboard-data";

export function TodayFocus({ items, onOpenProject }: { items: FocusItem[]; onOpenProject: (project: FocusItem["project"]) => void }) {
  return (
    <section className="card command-section command-span-8">
      <div className="command-section-head">
        <div><h2>今日重点</h2><p>Today&apos;s Focus · 按影响与时效排序</p></div>
        <Badge tone={items.some((item) => item.priority === "高") ? "red" : "neutral"}>{items.length} 项待处理</Badge>
      </div>
      <div className="focus-command-list">
        {items.map((item) => (
          <button className="focus-command-item" key={item.id} onClick={() => onOpenProject(item.project)}>
            <Badge tone={item.priority === "高" ? "red" : item.priority === "中" ? "amber" : "blue"}>{item.priority}优先级</Badge>
            <div className="focus-command-main">
              <span>{item.client} · {item.project.code}</span>
              <strong>{item.issue}</strong>
              <p>{item.reason}</p>
            </div>
            <div className="focus-command-action"><span>建议动作</span><strong>{item.action}</strong></div>
            <span className="command-arrow">›</span>
          </button>
        ))}
        {items.length === 0 && <p className="command-empty">今天没有需要优先处理的异常事项。</p>}
      </div>
    </section>
  );
}
