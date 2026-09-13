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
import { SampleList } from "../samples/sample-list";
import { getSampleContext } from "../samples/sample-data";
import type { SampleWorkspace } from "../samples/sample-data";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import type { QuotationWorkspace } from "../quotations/quotation-data";
import type { OrderWorkspace } from "../orders/order-data";

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
  sampleWorkspace: SampleWorkspace;
  quotationWorkspace: QuotationWorkspace;
  orderWorkspace: OrderWorkspace;
  onOpenSample: (id: string) => void;
  onOpenQuotation: (id: string) => void;
  onCreateQuotation: () => void;
  onOpenOrder: (id: string) => void;
  language: InterfaceLanguage;
  initialTab?: "overview" | "samples" | "quotations" | "orders";
};

export function ProjectCommandCenter({ project, stages, onBack, onUpdateStage, showToast, aiCopilot, sampleWorkspace, quotationWorkspace, orderWorkspace, onOpenSample, onOpenQuotation, onCreateQuotation, onOpenOrder, language, initialTab = "overview" }: ProjectCommandCenterProps) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [activityModal, setActivityModal] = useState(false);
  const data = useMemo(() => {
    const base = getProjectCommandData(project);
    const projectQuotes = quotationWorkspace.quotations.filter((item) => item.projectId === project.id);
    const quoteIds = new Set(projectQuotes.map((item) => item.id));
    const projectOrders = orderWorkspace.orders.filter((item) => item.projectId === project.id);
    const orderIds = new Set(projectOrders.map((item) => item.id));
    return { ...base, samples: sampleWorkspace.samples.filter((item) => item.projectId === project.id), sampleVersions: sampleWorkspace.versions.filter((item) => item.projectId === project.id), sampleFeedback: sampleWorkspace.feedback.filter((item) => item.projectId === project.id), quotations: projectQuotes, quotationTiers: quotationWorkspace.tiers.filter((item) => quoteIds.has(item.quotationId)), negotiationRecords: quotationWorkspace.records.filter((item) => item.projectId === project.id), purchaseOrders: projectOrders, orderLines: orderWorkspace.lines.filter((item) => orderIds.has(item.purchaseOrderId)), contracts: orderWorkspace.contracts.filter((item) => item.projectId === project.id), deliveries: orderWorkspace.deliveries.filter((item) => item.projectId === project.id), shipments: orderWorkspace.shipments.filter((item) => item.projectId === project.id) };
  }, [orderWorkspace, project, quotationWorkspace, sampleWorkspace]);
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
      <ProjectHeader data={data} priority={priority} expectedValue={opportunity.estimatedValue} stages={stages} onBack={onBack} onUpdateStage={onUpdateStage} onAddActivity={() => setActivityModal(true)} onCreateSample={() => { setTab("samples"); showToast("已打开项目样品；选择样品可创建后续版本"); }} onCreateQuote={() => { setTab("quotations"); if (data.quotations.length) showToast("已打开项目报价；点击记录进入谈判工作区"); else onCreateQuotation(); }} onEditProject={() => showToast("编辑项目为当前原型模拟操作")} />

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
      {tab === "samples" && <Card className="sample-workspace sample-list-panel"><div className="sample-section-head"><div><h2>项目样品 / Project Samples</h2><p>{project.code} · 点击样品进入开发工作区</p></div><Badge>Demo Workspace</Badge></div><SampleList rows={data.samples.map((sample) => getSampleContext(sample, sampleWorkspace, [project]))} onOpenSample={onOpenSample} language={language} /></Card>}
      {tab === "quotations" && <QuotationsPanel data={data} onOpen={onOpenQuotation} onCreate={onCreateQuotation} />}
      {tab === "communications" && <CommunicationsPanel data={data} onAdd={() => setActivityModal(true)} />}
      {tab === "orders" && <OrdersPanel data={data} onOpenOrder={onOpenOrder} />}
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

function QuotationsPanel({ data, onOpen, onCreate }: { data: ReturnType<typeof getProjectCommandData>; onOpen: (id: string) => void; onCreate: () => void }) {
  return <div className="command-entity-grid">{data.quotations.map((quote) => <Card className="entity-summary-card" key={quote.id}><div className="entity-card-head"><div><span>{quote.id}</span><h2>Quotation {quote.version}</h2></div><StatusBadge status={quote.status} /></div><strong className="entity-price">{quote.unitPrice ? `${quote.currency} ${quote.unitPrice}` : "待填写 / Pending"} <small>/ {quote.unit}</small></strong><dl><div><dt>Quantity</dt><dd>{quote.quantity ? quote.quantity.toLocaleString("en-US") : "尚未确认"}</dd></div><div><dt>Target Price</dt><dd>{quote.targetPrice ? `${quote.currency} ${quote.targetPrice}` : "尚未确认"}</dd></div><div><dt>Valid Until</dt><dd>{quote.validUntil || "尚未确认"}</dd></div><div><dt>Client Feedback</dt><dd>{quote.clientFeedback}</dd></div></dl><Button variant="secondary" onClick={() => onOpen(quote.id)}>查看报价与谈判 →</Button></Card>)}{data.quotations.length === 0 && <Card className="command-empty"><p>当前项目尚无正式报价。</p><Button onClick={onCreate}>从确认样创建报价 / Create from Approved Sample</Button></Card>}</div>;
}

function CommunicationsPanel({ data, onAdd }: { data: ReturnType<typeof getProjectCommandData>; onAdd: () => void }) {
  return <Card className="command-tab-panel"><div className="compact-section-head"><div><h2>沟通记录</h2><p>Communications · 客户信号与内部协作</p></div><Button onClick={onAdd}>＋ 添加活动</Button></div><div className="project-communications">{[...data.communications].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).map((item) => <article key={item.id}><div><Badge>{item.type}</Badge><span>{new Date(item.occurredAt).toLocaleDateString("zh-CN")}</span></div><strong>{item.subject}</strong><p>{item.content}</p><small>{item.author} · {item.language}</small></article>)}{data.communications.length === 0 && <p className="command-empty">当前项目尚无沟通记录。</p>}</div></Card>;
}

function OrdersPanel({ data, onOpenOrder }: { data: ReturnType<typeof getProjectCommandData>; onOpenOrder: (id: string) => void }) {
  const po = data.purchaseOrders[0];
  if (!po) return <Card className="command-empty command-tab-panel">当前项目尚未创建 Purchase Order。</Card>;
  return <Card className="command-tab-panel order-flow-panel"><div className="compact-section-head"><div><h2>{po.poNumber}</h2><p>PO → Contract → Production → Approval → Delivery → Shipment → Payment</p></div><StatusBadge status={po.currentStage} /></div><div className="order-flow"><div><span>PO</span><strong>{po.currency} {po.amount.toLocaleString("en-US")}</strong><small>{po.poDate}</small></div><div><span>Contract</span><strong>{data.contracts[0]?.status ?? "Pending"}</strong><small>{data.contracts[0]?.contractNumber ?? "尚未确认"}</small></div><div><span>Production</span><strong>{po.production?.status ?? "Not Started"}</strong><small>{po.production?.progress ?? 0}%</small></div><div><span>Delivery</span><strong>{data.deliveries[0]?.status ?? "Pending"}</strong><small>{data.deliveries[0]?.plannedDate ?? po.deliveryDate}</small></div><div><span>Shipment</span><strong>{data.shipments[0]?.status ?? "Pending"}</strong><small>{data.shipments[0]?.etd ?? "尚未确认"}</small></div></div><Button onClick={() => onOpenOrder(po.id)}>进入订单执行工作区 →</Button></Card>;
}

function TimelinePanel({ events }: { events: TimelineEvent[] }) {
  return <Card className="command-tab-panel"><div className="compact-section-head"><div><h2>项目完整时间线</h2><p>Timeline · 从询盘到当前业务节点</p></div><span>{events.length} 条</span></div><div className="full-project-timeline">{events.map((event) => <article key={event.id}><span className="activity-glyph">{event.icon}</span><div><span>{event.displayDate} · {event.type}</span><strong>{event.title}</strong><p>{event.description}</p></div></article>)}</div></Card>;
}
