"use client";

import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { LifecycleStepper } from "../business/lifecycle-stepper";
import { StatusBadge } from "../business/status-badge";
import { Badge, Button, Card, Modal } from "../ui/primitives";
import type { Project, ProjectStage, TimelineEvent } from "../../lib/mock-data";
import {
  getCommercialOpportunity,
  getLifecycleMilestones,
  getOpportunityPriority,
  getProjectCommandData,
  getStageSummary,
} from "./project-command-data";
import { ProjectHeader } from "./project-header";
import { ProjectOverview } from "./project-overview";

type TabId = "overview" | "requirements" | "samples" | "quotations" | "communications" | "orders" | "timeline" | "ai";

const tabs: Array<{ id: TabId; label: string; labelEn: string }> = [
  { id: "overview", label: "项目概览", labelEn: "Overview" },
  { id: "requirements", label: "产品需求", labelEn: "Requirements" },
  { id: "samples", label: "样品", labelEn: "Samples" },
  { id: "quotations", label: "报价", labelEn: "Quotations" },
  { id: "communications", label: "沟通记录", labelEn: "Communications" },
  { id: "orders", label: "订单", labelEn: "Orders" },
  { id: "timeline", label: "时间线", labelEn: "Timeline" },
  { id: "ai", label: "AI Copilot", labelEn: "AI Copilot" },
];

type ProjectCommandCenterProps = {
  project: Project;
  stages: ProjectStage[];
  onBack: () => void;
  onUpdateStage: (stage: ProjectStage) => void;
  showToast: (message: string) => void;
  aiCopilot: ReactNode;
};

export function ProjectCommandCenter({ project, stages, onBack, onUpdateStage, showToast, aiCopilot }: ProjectCommandCenterProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const [activityModal, setActivityModal] = useState(false);
  const data = useMemo(() => getProjectCommandData(project), [project]);
  const [localEvents, setLocalEvents] = useState<TimelineEvent[]>(data.timeline);
  const priority = getOpportunityPriority(data);
  const opportunity = getCommercialOpportunity(data);

  const addActivity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type")) as TimelineEvent["type"];
    const content = String(form.get("content"));
    const newEvent: TimelineEvent = { id: `local-${Date.now()}`, projectId: project.id, clientId: project.clientId, type, occurredAt: new Date().toISOString(), displayDate: "刚刚", title: String(form.get("title")) || "新增项目活动", description: content, icon: type === "sample" ? "◈" : type === "quotation" ? "¥" : type === "task" ? "✓" : "✉" };
    setLocalEvents((current) => [newEvent, ...current]);
    setActivityModal(false);
    showToast("项目活动已添加（模拟）");
  };

  return (
    <div className="project-command-center">
      <ProjectHeader data={data} priority={priority} expectedValue={opportunity.estimatedValue} stages={stages} onBack={onBack} onUpdateStage={onUpdateStage} onAddActivity={() => setActivityModal(true)} onCreateSample={() => { setTab("samples"); showToast("已打开样品页签；创建流程将在 Step 5 完成"); }} onCreateQuote={() => { setTab("quotations"); showToast("已打开报价页签；创建流程将在 Step 6 完成"); }} onEditProject={() => showToast("编辑项目为当前原型模拟操作")} />

      <Card className="project-lifecycle-card">
        <div className="lifecycle-card-head"><div><span>Lifecycle Control</span><strong>项目生命周期控制</strong></div><StatusBadge status={project.lifecycleStage} /></div>
        <LifecycleStepper currentStage={project.lifecycleStage} milestones={getLifecycleMilestones(data)} />
        <p className="current-stage-summary"><span>Current Stage Summary</span>{getStageSummary(data)}</p>
      </Card>

      <div className="project-command-tabs" role="tablist" aria-label="项目详情">
        {tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><strong>{item.label}</strong><span>{item.labelEn}</span>{item.id === "requirements" && data.requirements.some((requirement) => requirement.status !== "已确认") && <b>{data.requirements.filter((requirement) => requirement.status !== "已确认").length}</b>}</button>)}
      </div>

      {tab === "overview" && <ProjectOverview data={data} events={localEvents} onViewTimeline={() => setTab("timeline")} />}
      {tab === "requirements" && <RequirementsPanel data={data} />}
      {tab === "samples" && <SamplesPanel data={data} />}
      {tab === "quotations" && <QuotationsPanel data={data} />}
      {tab === "communications" && <CommunicationsPanel data={data} onAdd={() => setActivityModal(true)} />}
      {tab === "orders" && <OrdersPanel data={data} />}
      {tab === "timeline" && <TimelinePanel events={localEvents} />}
      {tab === "ai" && aiCopilot}

      {activityModal && <Modal title="添加项目活动" onClose={() => setActivityModal(false)}><form className="modal-form" onSubmit={addActivity}><div className="form-row"><label>活动类型 / Activity Type<select name="type"><option value="communication">客户沟通</option><option value="sample">样品进展</option><option value="quotation">报价进展</option><option value="task">内部任务</option></select></label><label>活动标题 / Title<input name="title" required placeholder="例如：收到客户价格反馈" /></label></div><label>活动内容 / Activity Notes<textarea name="content" required rows={5} placeholder="记录事实、客户信号与后续影响..." /></label><div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setActivityModal(false)}>取消</Button><Button type="submit">保存活动</Button></div></form></Modal>}
    </div>
  );
}

function RequirementsPanel({ data }: { data: ReturnType<typeof getProjectCommandData> }) {
  const confirmed = data.requirements.filter((item) => item.status === "已确认").length;
  const completeness = data.requirements.length ? Math.round(confirmed / data.requirements.length * 100) : 0;
  return <Card className="table-card command-tab-panel"><div className="compact-section-head"><div><h2>结构化产品需求</h2><p>Requirements · 当前项目专属资料</p></div><Badge tone="blue">{completeness}% 完整</Badge></div><div className="table-wrap"><table><thead><tr><th>产品 / Product</th><th>业务字段 / Business Field</th><th>当前值 / Current Value</th><th>状态 / Status</th><th>来源 / Source</th></tr></thead><tbody>{data.requirements.map((item) => <tr key={item.id}><td>{item.product}</td><td><strong>{item.field} / {item.fieldEn}</strong></td><td>{item.value}</td><td><Badge tone={item.status === "已确认" ? "green" : item.status === "有冲突" ? "red" : "amber"}>{item.status}</Badge></td><td>{item.source}</td></tr>)}{data.requirements.length === 0 && <tr><td colSpan={5}>当前项目材料中尚未确认产品需求。</td></tr>}</tbody></table></div></Card>;
}

function SamplesPanel({ data }: { data: ReturnType<typeof getProjectCommandData> }) {
  return <div className="command-entity-grid">{data.samples.map((sample) => <Card className="entity-summary-card" key={sample.id}><div className="entity-card-head"><div><span>{sample.id}</span><h2>{sample.product}</h2></div><StatusBadge status={sample.status} /></div><dl><div><dt>Version</dt><dd>{sample.currentVersion}</dd></div><div><dt>Sent Date</dt><dd>{sample.sentDate ?? "尚未寄出"}</dd></div><div><dt>Feedback</dt><dd>{sample.feedbackStatus}</dd></div><div><dt>Next Action</dt><dd>{sample.nextAction}</dd></div></dl><p className="prototype-note">样品中心完整功能将在 Step 5 实现。</p></Card>)}{data.samples.length === 0 && <Card className="command-empty">当前项目尚无样品记录。</Card>}</div>;
}

function QuotationsPanel({ data }: { data: ReturnType<typeof getProjectCommandData> }) {
  return <div className="command-entity-grid">{data.quotations.map((quote) => <Card className="entity-summary-card" key={quote.id}><div className="entity-card-head"><div><span>{quote.id}</span><h2>Quotation {quote.version}</h2></div><StatusBadge status={quote.status} /></div><strong className="entity-price">{quote.currency} {quote.unitPrice} <small>/ {quote.unit}</small></strong><dl><div><dt>Quantity</dt><dd>{quote.quantity.toLocaleString("en-US")}</dd></div><div><dt>Target Price</dt><dd>{quote.targetPrice ? `${quote.currency} ${quote.targetPrice}` : "尚未确认"}</dd></div><div><dt>Valid Until</dt><dd>{quote.validUntil}</dd></div><div><dt>Client Feedback</dt><dd>{quote.clientFeedback}</dd></div></dl><p className="prototype-note">报价中心完整功能将在 Step 6 实现。</p></Card>)}{data.quotations.length === 0 && <Card className="command-empty">当前项目尚无正式报价。</Card>}</div>;
}

function CommunicationsPanel({ data, onAdd }: { data: ReturnType<typeof getProjectCommandData>; onAdd: () => void }) {
  return <Card className="command-tab-panel"><div className="compact-section-head"><div><h2>沟通记录</h2><p>Communications · 客户信号与内部协作</p></div><Button onClick={onAdd}>＋ 添加活动</Button></div><div className="project-communications">{[...data.communications].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).map((item) => <article key={item.id}><div><Badge>{item.type}</Badge><span>{new Date(item.occurredAt).toLocaleDateString("zh-CN")}</span></div><strong>{item.subject}</strong><p>{item.content}</p><small>{item.author} · {item.language}</small></article>)}{data.communications.length === 0 && <p className="command-empty">当前项目尚无沟通记录。</p>}</div></Card>;
}

function OrdersPanel({ data }: { data: ReturnType<typeof getProjectCommandData> }) {
  const po = data.purchaseOrders[0];
  if (!po) return <Card className="command-empty command-tab-panel">当前项目尚未创建 Purchase Order。</Card>;
  return <Card className="command-tab-panel order-flow-panel"><div className="compact-section-head"><div><h2>{po.poNumber}</h2><p>PO → Contract → Delivery → Shipment</p></div><StatusBadge status={po.currentStage} /></div><div className="order-flow"><div><span>PO</span><strong>{po.currency} {po.amount.toLocaleString("en-US")}</strong><small>{po.poDate}</small></div><div><span>Contract</span><strong>{data.contracts[0]?.status ?? "Pending"}</strong><small>{data.contracts[0]?.contractNumber ?? "尚未确认"}</small></div><div><span>Delivery</span><strong>{data.deliveries[0]?.status ?? "Pending"}</strong><small>{data.deliveries[0]?.plannedDate ?? po.deliveryDate}</small></div><div><span>Shipment</span><strong>{data.shipments[0]?.status ?? "Pending"}</strong><small>{data.shipments[0]?.etd ?? "尚未确认"}</small></div></div><p className="prototype-note">订单中心完整功能将在 Step 7 实现。</p></Card>;
}

function TimelinePanel({ events }: { events: TimelineEvent[] }) {
  return <Card className="command-tab-panel"><div className="compact-section-head"><div><h2>项目完整时间线</h2><p>Timeline · 从询盘到当前业务节点</p></div><span>{events.length} 条</span></div><div className="full-project-timeline">{events.map((event) => <article key={event.id}><span className="activity-glyph">{event.icon}</span><div><span>{event.displayDate} · {event.type}</span><strong>{event.title}</strong><p>{event.description}</p></div></article>)}</div></Card>;
}
