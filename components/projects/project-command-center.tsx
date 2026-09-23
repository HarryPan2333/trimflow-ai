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
import { useI18n } from "../providers/language-provider";
import type { ProductLibraryData } from "../../lib/product-library/types";
import { getProjectProducts, getProductById } from "../../lib/product-library/selectors";
import type { AccountState } from "../../lib/accounts/types";

type TabId = "overview" | "requirements" | "samples" | "quotations" | "communications" | "orders" | "timeline" | "ai";

const tabs: TabId[] = ["overview", "requirements", "samples", "quotations", "communications", "orders", "timeline", "ai"];

type ProjectCommandCenterProps = {
  project: Project;
  accountState?: AccountState;
  stages: ProjectStage[];
  onBack: () => void;
  onUpdateStage: (stage: ProjectStage) => void;
  showToast: (message: string) => void;
  aiCopilot: ReactNode;
  sampleWorkspace: SampleWorkspace;
  quotationWorkspace: QuotationWorkspace;
  orderWorkspace: OrderWorkspace;
  productLibrary: ProductLibraryData;
  onBrowseProducts: () => void;
  onOpenProduct: (id: string) => void;
  onOpenSample: (id: string) => void;
  onOpenQuotation: (id: string) => void;
  onCreateQuotation: () => void;
  onOpenOrder: (id: string) => void;
  language: InterfaceLanguage;
  initialTab?: "overview" | "samples" | "quotations" | "orders";
};

export function ProjectCommandCenter({ project, accountState, stages, onBack, onUpdateStage, showToast, aiCopilot, sampleWorkspace, quotationWorkspace, orderWorkspace, productLibrary, onBrowseProducts, onOpenProduct, onOpenSample, onOpenQuotation, onCreateQuotation, onOpenOrder, language, initialTab = "overview" }: ProjectCommandCenterProps) {
  const { language: appLanguage, t, text } = useI18n();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [activityModal, setActivityModal] = useState(false);
  const data = useMemo(() => {
    const base = getProjectCommandData(project, accountState);
    const projectQuotes = quotationWorkspace.quotations.filter((item) => item.projectId === project.id);
    const quoteIds = new Set(projectQuotes.map((item) => item.id));
    const projectOrders = orderWorkspace.orders.filter((item) => item.projectId === project.id);
    const orderIds = new Set(projectOrders.map((item) => item.id));
    return { ...base, samples: sampleWorkspace.samples.filter((item) => item.projectId === project.id), sampleVersions: sampleWorkspace.versions.filter((item) => item.projectId === project.id), sampleFeedback: sampleWorkspace.feedback.filter((item) => item.projectId === project.id), quotations: projectQuotes, quotationTiers: quotationWorkspace.tiers.filter((item) => quoteIds.has(item.quotationId)), negotiationRecords: quotationWorkspace.records.filter((item) => item.projectId === project.id), purchaseOrders: projectOrders, orderLines: orderWorkspace.lines.filter((item) => orderIds.has(item.purchaseOrderId)), contracts: orderWorkspace.contracts.filter((item) => item.projectId === project.id), deliveries: orderWorkspace.deliveries.filter((item) => item.projectId === project.id), shipments: orderWorkspace.shipments.filter((item) => item.projectId === project.id) };
  }, [accountState, orderWorkspace, project, quotationWorkspace, sampleWorkspace]);
  const [localEvents, setLocalEvents] = useState<TimelineEvent[]>(data.timeline);
  const priority = getOpportunityPriority(data, appLanguage);
  const opportunity = getCommercialOpportunity(data, appLanguage);

  const addActivity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type")) as TimelineEvent["type"];
    const content = String(form.get("content"));
    const newEvent: TimelineEvent = { id: `local-${Date.now()}`, projectId: project.id, clientId: project.clientId, type, occurredAt: new Date().toISOString(), displayDate: appLanguage === "zh" ? "刚刚" : "Just now", title: String(form.get("title")) || (appLanguage === "zh" ? "新增项目活动" : "New project activity"), description: content, icon: type === "sample" ? "◈" : type === "quotation" ? "¥" : type === "task" ? "✓" : "✉" };
    setLocalEvents((current) => [newEvent, ...current]);
    setActivityModal(false);
    showToast(appLanguage === "zh" ? "项目活动已添加（模拟）" : "Project activity added (demo)");
  };

  return (
    <div className="project-command-center">
      <ProjectHeader data={data} priority={priority} expectedValue={opportunity.estimatedValue} stages={stages} onBack={onBack} onUpdateStage={onUpdateStage} onAddActivity={() => setActivityModal(true)} onCreateSample={() => { setTab("samples"); showToast(appLanguage === "zh" ? "已打开项目样品；选择样品可创建后续版本" : "Project samples opened; select a sample to create a revision"); }} onCreateQuote={() => { setTab("quotations"); if (data.quotations.length) showToast(appLanguage === "zh" ? "已打开项目报价；点击记录进入谈判工作区" : "Project quotations opened; select a record to enter negotiation"); else onCreateQuotation(); }} onEditProject={() => showToast(appLanguage === "zh" ? "编辑项目为当前原型模拟操作" : "Edit project is a demo action")} />

      <Card className="project-lifecycle-card">
        <div className="lifecycle-card-head"><div><span>Lifecycle Control</span><strong>{t("project.lifecycleControl")}</strong></div><StatusBadge status={project.lifecycleStage} /></div>
        <LifecycleStepper currentStage={project.lifecycleStage} milestones={getLifecycleMilestones(data, appLanguage)} />
        <p className="current-stage-summary"><span>{t("project.stageSummary")}</span>{text(getStageSummary(data, appLanguage))}</p>
      </Card>

      <Card className="project-product-section"><div className="project-product-section-head"><div><h2>{t("product.projectProducts")}</h2><p>{t("product.projectBrowse")}</p></div><Button variant="secondary" onClick={onBrowseProducts}>{t("product.browse")} →</Button></div><div className="project-product-list">{getProjectProducts(productLibrary, project.id).map((relation) => { const linked = getProductById(productLibrary, relation.productId); return linked && <button className="project-product-link" key={relation.id} onClick={() => onOpenProduct(linked.id)}><strong>{text(linked.name)}</strong><span>{relation.variantId ? productLibrary.variants.find((item) => item.id === relation.variantId)?.variantCode : t("product.familyLevel")}</span><Badge>{t(`product.${relation.proposalStatus}`)}</Badge></button>; })}{!getProjectProducts(productLibrary, project.id).length && <p>{t("product.noProjectProducts")}</p>}</div></Card>

      <div className="project-command-tabs" role="tablist" aria-label={t("project.commandCenter")}>
        {tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}><strong>{t(`project.tabs.${item}`)}</strong>{item === "requirements" && data.requirements.some((requirement) => requirement.status !== "已确认") && <b>{data.requirements.filter((requirement) => requirement.status !== "已确认").length}</b>}</button>)}
      </div>

      {tab === "overview" && <ProjectOverview data={data} events={localEvents} onViewTimeline={() => setTab("timeline")} />}
      {tab === "requirements" && <RequirementsPanel data={data} />}
      {tab === "samples" && <Card className="sample-workspace sample-list-panel"><div className="sample-section-head"><div><h2>{t("project.samples.title")}</h2><p>{project.code} · {t("project.samples.subtitle")}</p></div><Badge>{t("common.demoWorkspace")}</Badge></div><SampleList rows={data.samples.map((sample) => getSampleContext(sample, sampleWorkspace, [project], accountState))} onOpenSample={onOpenSample} language={language} /></Card>}
      {tab === "quotations" && <QuotationsPanel data={data} onOpen={onOpenQuotation} onCreate={onCreateQuotation} />}
      {tab === "communications" && <CommunicationsPanel data={data} onAdd={() => setActivityModal(true)} />}
      {tab === "orders" && <OrdersPanel data={data} onOpenOrder={onOpenOrder} />}
      {tab === "timeline" && <TimelinePanel events={localEvents} />}
      {tab === "ai" && aiCopilot}

      {activityModal && <Modal title={appLanguage === "zh" ? "添加项目活动" : "Add Project Activity"} onClose={() => setActivityModal(false)}><form className="modal-form" onSubmit={addActivity}><div className="form-row"><label>{appLanguage === "zh" ? "活动类型" : "Activity Type"}<select name="type"><option value="communication">{appLanguage === "zh" ? "客户沟通" : "Client Communication"}</option><option value="sample">{appLanguage === "zh" ? "样品进展" : "Sample Progress"}</option><option value="quotation">{appLanguage === "zh" ? "报价进展" : "Quotation Progress"}</option><option value="task">{appLanguage === "zh" ? "内部任务" : "Internal Task"}</option></select></label><label>{appLanguage === "zh" ? "活动标题" : "Activity Title"}<input name="title" required placeholder={appLanguage === "zh" ? "例如：收到客户价格反馈" : "Example: Received client price feedback"} /></label></div><label>{appLanguage === "zh" ? "活动内容" : "Activity Notes"}<textarea name="content" required rows={5} placeholder={appLanguage === "zh" ? "记录事实、客户信号与后续影响..." : "Record facts, client signals, and downstream impact..."} /></label><div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setActivityModal(false)}>{t("actions.cancel")}</Button><Button type="submit">{t("actions.save")}</Button></div></form></Modal>}
    </div>
  );
}

function RequirementsPanel({ data }: { data: ReturnType<typeof getProjectCommandData> }) {
  const { t, label, text } = useI18n();
  const confirmed = data.requirements.filter((item) => item.status === "已确认").length;
  const completeness = data.requirements.length ? Math.round(confirmed / data.requirements.length * 100) : 0;
  return <Card className="table-card command-tab-panel"><div className="compact-section-head"><div><h2>{t("project.requirements.title")}</h2><p>{t("project.requirements.subtitle")}</p></div><Badge tone="blue">{t("project.requirements.completeness", { percent: completeness })}</Badge></div><div className="table-wrap"><table><thead><tr><th>{t("common.product")}</th><th>{t("common.field")}</th><th>{t("common.value")}</th><th>{t("common.status")}</th><th>{t("common.source")}</th></tr></thead><tbody>{data.requirements.map((item) => <tr key={item.id}><td>{text(item.product)}</td><td><strong>{label(item.field)}</strong></td><td>{text(item.value)}</td><td><Badge tone={item.status === "已确认" ? "green" : item.status === "有冲突" ? "red" : "amber"}>{label(item.status)}</Badge></td><td>{text(item.source)}</td></tr>)}{data.requirements.length === 0 && <tr><td colSpan={5}>{t("common.notConfirmed")}</td></tr>}</tbody></table></div></Card>;
}

function QuotationsPanel({ data, onOpen, onCreate }: { data: ReturnType<typeof getProjectCommandData>; onOpen: (id: string) => void; onCreate: () => void }) {
  const { t, label, text, formatDate } = useI18n();
  return <div className="command-entity-grid">{data.quotations.map((quote) => <Card className="entity-summary-card" key={quote.id}><div className="entity-card-head"><div><span>{quote.id}</span><h2>Quotation {quote.version}</h2></div><StatusBadge status={quote.status} /></div><strong className="entity-price">{quote.unitPrice ? `${quote.currency} ${quote.unitPrice}` : t("common.notConfirmed")} <small>/ {label(quote.unit)}</small></strong><dl><div><dt>{t("common.quantity")}</dt><dd>{quote.quantity ? quote.quantity.toLocaleString("en-US") : t("common.notConfirmed")}</dd></div><div><dt>{t("quotation.targetPrice")}</dt><dd>{quote.targetPrice ? `${quote.currency} ${quote.targetPrice}` : t("common.notConfirmed")}</dd></div><div><dt>{t("common.validUntil")}</dt><dd>{quote.validUntil ? formatDate(quote.validUntil) : t("common.notConfirmed")}</dd></div><div><dt>{t("quotation.clientFeedback")}</dt><dd>{text(quote.clientFeedback)}</dd></div></dl><Button variant="secondary" onClick={() => onOpen(quote.id)}>{t("actions.openWorkspace")} →</Button></Card>)}{data.quotations.length === 0 && <Card className="command-empty"><p>{t("project.quotations.empty")}</p><Button onClick={onCreate}>{t("project.quotations.createFromSample")}</Button></Card>}</div>;
}

function CommunicationsPanel({ data, onAdd }: { data: ReturnType<typeof getProjectCommandData>; onAdd: () => void }) {
  const { t, label, text, formatDate } = useI18n();
  return <Card className="command-tab-panel"><div className="compact-section-head"><div><h2>{t("project.communications.title")}</h2><p>{t("project.communications.subtitle")}</p></div><Button onClick={onAdd}>＋ {t("project.addActivity")}</Button></div><div className="project-communications">{[...data.communications].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).map((item) => <article key={item.id}><div><Badge>{label(item.type)}</Badge><span>{formatDate(item.occurredAt)}</span></div><strong>{text(item.subject)}</strong><p>{text(item.content)}</p><small>{item.author} · {label(item.language)}</small></article>)}{data.communications.length === 0 && <p className="command-empty">{t("project.communications.empty")}</p>}</div></Card>;
}

function OrdersPanel({ data, onOpenOrder }: { data: ReturnType<typeof getProjectCommandData>; onOpenOrder: (id: string) => void }) {
  const { t, label, formatDate } = useI18n();
  const po = data.purchaseOrders[0];
  if (!po) return <Card className="command-empty command-tab-panel">{t("project.orders.empty")}</Card>;
  return <Card className="command-tab-panel order-flow-panel"><div className="compact-section-head"><div><h2>{po.poNumber}</h2><p>PO → Contract → Production → Approval → Delivery → Shipment → Payment</p></div><StatusBadge status={po.currentStage} /></div><div className="order-flow"><div><span>PO</span><strong>{po.currency} {po.amount.toLocaleString("en-US")}</strong><small>{formatDate(po.poDate)}</small></div><div><span>Contract</span><strong>{label(data.contracts[0]?.status ?? "Pending")}</strong><small>{data.contracts[0]?.contractNumber ?? t("common.notConfirmed")}</small></div><div><span>Production</span><strong>{label(po.production?.status ?? "Not Started")}</strong><small>{po.production?.progress ?? 0}%</small></div><div><span>Delivery</span><strong>{label(data.deliveries[0]?.status ?? "Pending")}</strong><small>{formatDate(data.deliveries[0]?.plannedDate ?? po.deliveryDate)}</small></div><div><span>Shipment</span><strong>{label(data.shipments[0]?.status ?? "Pending")}</strong><small>{data.shipments[0]?.etd ? formatDate(data.shipments[0].etd) : t("common.notConfirmed")}</small></div></div><Button onClick={() => onOpenOrder(po.id)}>{t("actions.openWorkspace")} →</Button></Card>;
}

function TimelinePanel({ events }: { events: TimelineEvent[] }) {
  const { t, label, text, formatDate } = useI18n();
  return <Card className="command-tab-panel"><div className="compact-section-head"><div><h2>{t("project.timeline.title")}</h2><p>{t("project.timeline.subtitle")}</p></div><span>{t("common.count", { count: events.length })}</span></div><div className="full-project-timeline">{events.map((event) => <article key={event.id}><span className="activity-glyph">{event.icon}</span><div><span>{formatDate(event.occurredAt)} · {label(event.type)}</span><strong>{text(event.title)}</strong><p>{text(event.description)}</p></div></article>)}</div></Card>;
}
