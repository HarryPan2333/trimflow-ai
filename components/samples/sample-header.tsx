"use client";

import { Badge, Button } from "../ui/primitives";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import { getSampleReadiness, getSampleStatus, typeLabels } from "./sample-data";
import type { SampleContext } from "./sample-data";
import { SampleStatusBadge } from "./sample-list";

export function SampleHeader({ context, language, onBack, onClient, onProject, onAction }: { context: SampleContext; language: InterfaceLanguage; onBack: () => void; onClient: () => void; onProject: () => void; onAction: (action: "feedback" | "revision" | "sent" | "approved") => void }) {
  const { sample, current } = context;
  const isEn = language === "English";
  const status = getSampleStatus(context);
  const approvalAllowed = getSampleReadiness(context).specsReady && Boolean(current?.sentDate) && status !== "Approved" && !["Rejected", "Closed"].includes(status);
  return <header className="sample-detail-header">
    <div className="sample-breadcrumb"><button onClick={onBack}>‹ {isEn ? "Sample Development" : "样品开发中心"}</button><span>/</span><button onClick={onClient}>{context.client?.name ?? context.project?.customer}</button><span>/</span><button onClick={onProject}>{context.project?.code}</button></div>
    <div className="sample-title-line"><div className="sample-title"><span className="sample-object-icon">◈</span><div><span>{sample.id}</span><h1>{sample.product}</h1><p>{context.project?.name}</p></div></div><div className="sample-header-badges"><b className="sample-version-pill">{current?.version}</b><SampleStatusBadge status={status} language={language} /><Badge>Demo Workspace</Badge></div></div>
    <div className="sample-header-bottom"><dl><div><dt>类型 / Sample Type</dt><dd>{sample.sampleType ? isEn ? sample.sampleType : typeLabels[sample.sampleType] : "待确认"}</dd></div><div><dt>负责人 / Owner</dt><dd>{sample.owner ?? context.project?.owner}</dd></div><div><dt>目标日期 / Target Date</dt><dd>{sample.targetDate ?? "待确认"}</dd></div></dl><div className="sample-header-actions"><Button variant="secondary" onClick={() => onAction("feedback")}>{isEn ? "+ Add Feedback" : "＋ 添加反馈"}</Button><Button variant="secondary" onClick={() => onAction("revision")}>{isEn ? "Create Revision" : "创建新版本"}</Button><Button variant="secondary" disabled={Boolean(current?.sentDate) || !current} onClick={() => onAction("sent")}>{isEn ? "Mark as Sent" : "标记寄出"}</Button><Button disabled={!approvalAllowed} title={approvalAllowed ? "" : "需先寄出当前版本、确认关键规格并解决影响确认的反馈"} onClick={() => onAction("approved")}>{isEn ? "Mark as Approved" : "标记确认"}</Button></div></div>
  </header>;
}
