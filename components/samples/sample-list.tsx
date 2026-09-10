"use client";

import { Badge } from "../ui/primitives";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import { feedbackSummary, getSampleNextAction, getSampleStatus, statusLabels, typeLabels } from "./sample-data";
import type { DevelopmentStatus, SampleContext } from "./sample-data";

const tones: Record<DevelopmentStatus, string> = { Requested: "neutral", "In Development": "blue", Ready: "cyan", Sent: "blue", "Client Reviewing": "amber", "Revision Required": "orange", Approved: "green", Rejected: "red", Closed: "neutral" };

export function SampleStatusBadge({ status, language = "中文" }: { status: DevelopmentStatus; language?: InterfaceLanguage }) {
  return <Badge tone={tones[status]}>{language === "English" ? status : statusLabels[status]}</Badge>;
}

export function SampleList({ rows, onOpenSample, language }: { rows: SampleContext[]; onOpenSample: (id: string) => void; language: InterfaceLanguage }) {
  const isEn = language === "English";
  return <>
    <div className="sample-table-scroll"><table className="sample-table"><thead><tr>
      <th>样品 / Sample</th><th>客户 · 项目 / Client · Project</th><th>类型 / Type</th><th>版本 / Version</th><th>状态 / Status</th><th>日期 / Dates</th><th>反馈 / Feedback</th><th>负责人 / Owner</th><th>下一步 / Next Action</th>
    </tr></thead><tbody>{rows.map((context) => {
      const { sample, current, client, project } = context;
      return <tr key={sample.id}><td><button className="sample-id-link" onClick={() => onOpenSample(sample.id)}>{sample.id} <span>↗</span></button><strong>{sample.product}</strong></td><td><span>{client?.name ?? project?.customer}</span><small>{project?.code} · {project?.name}</small></td><td>{sample.sampleType ? isEn ? sample.sampleType : typeLabels[sample.sampleType] : "待确认"}</td><td><b className="sample-version-pill">{current?.version ?? "—"}</b></td><td><SampleStatusBadge status={getSampleStatus(context)} language={language} /></td><td className="sample-dates"><span>申请 {sample.createdAt}</span><span>目标 {sample.targetDate ?? "待确认"}</span><span>寄出 {current?.sentDate ?? "尚未寄出"}</span></td><td>{feedbackSummary(context)}</td><td>{sample.owner ?? project?.owner}</td><td>{getSampleNextAction(context).action}</td></tr>;
    })}</tbody></table></div>
    <div className="sample-mobile-list">{rows.map((context) => <button className="sample-mobile-row" key={context.sample.id} onClick={() => onOpenSample(context.sample.id)}><span className="sample-mobile-heading"><strong>{context.sample.id}</strong><SampleStatusBadge status={getSampleStatus(context)} language={language} /></span><span>{context.client?.name ?? context.project?.customer}</span><b>{context.sample.product}<i>{context.current?.version}</i></b><span className="sample-mobile-next">→ {getSampleNextAction(context).action}</span></button>)}</div>
    {rows.length === 0 && <div className="sample-empty">{isEn ? "No samples match your search." : "没有匹配的样品，请调整搜索或筛选条件。"}</div>}
  </>;
}
