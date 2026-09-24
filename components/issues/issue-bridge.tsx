"use client";

import { Button, Card } from "../ui/primitives";
import { useI18n } from "../providers/language-provider";
import type { Issue } from "../../lib/issues/types";
import { isActiveIssue } from "../../lib/issues/selectors";
import { severityLabels, statusLabels } from "../../lib/issues/labels";

export function IssueBridge({ issues, scope, onOpen, onCreate }: { issues: Issue[]; scope: "account" | "project" | "sample" | "order"; onOpen: (id: string) => void; onCreate: () => void }) {
  const { language } = useI18n();
  const open = issues.filter(isActiveIssue);
  const resolved = issues.filter((issue) => !isActiveIssue(issue));
  const title = scope === "account" ? { zh: "客户问题与近期解决", en: "Account Issues & Resolutions" } : scope === "project" ? { zh: "项目问题与阻塞", en: "Project Issues & Blockers" } : scope === "sample" ? { zh: "关联样品问题", en: "Related Sample Issues" } : { zh: "订单执行问题", en: "Order Execution Issues" };
  return <Card className="issue-bridge"><div className="issue-bridge-head"><div><span className="eyebrow">ISSUE MEMORY</span><h2>{title[language]}</h2><p>{language === "zh" ? `进行中 ${open.length} · 已解决 ${resolved.length}` : `${open.length} active · ${resolved.length} resolved`}</p></div><Button variant="secondary" onClick={onCreate}>{language === "zh" ? "＋ 创建问题" : "+ Create Issue"}</Button></div>
    {issues.length ? <div className="issue-bridge-list">{[...open, ...resolved].slice(0, 3).map((issue) => <button key={issue.id} onClick={() => onOpen(issue.id)}><strong>{issue.title[language]}</strong><span>{severityLabels[issue.severity][language]} · {statusLabels[issue.status][language]} →</span></button>)}</div> : <p className="issue-empty-copy">{language === "zh" ? "暂无关联问题。不会根据进度自动生成客诉。" : "No related issues. Claims are never created automatically from progress."}</p>}</Card>;
}
