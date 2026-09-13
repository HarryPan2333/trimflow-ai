"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Badge, Button, Card } from "../ui/primitives";
import type { OrderApproval, ProductionMilestone } from "../../lib/mock-data";
import {
  canCompleteOrder,
  formatOrderValue,
  getCriticalPath,
  getExecutionRisks,
  getLifecycle,
  getOrderHealth,
  getOrderNextActions,
  getPaymentRisk,
  getShipmentReadiness,
  type OrderContext,
  type TimelineFilter,
} from "./order-data";

export function OrderLifecycle({ context }: { context: OrderContext }) {
  return <Card className="order-lifecycle"><div className="order-section-head"><div><span>EXECUTION LIFECYCLE</span><h2>订单执行生命周期</h2></div><Badge>{context.order.currentStage}</Badge></div><div className="order-lifecycle-scroll">{getLifecycle(context).map((item, index) => <article className={`order-life-${item.status.toLowerCase()}`} key={item.stage}><div><span>{String(index + 1).padStart(2, "0")}</span><i>{item.status === "Completed" ? "✓" : item.status === "Blocked" ? "!" : ""}</i></div><strong>{item.stage}</strong><small>{item.status}</small><dl><div><dt>Owner</dt><dd>{item.owner}</dd></div><div><dt>Target</dt><dd>{item.targetDate}</dd></div>{item.actualDate && <div><dt>Actual</dt><dd>{item.actualDate}</dd></div>}<div><dt>Dependency</dt><dd>{item.dependency}</dd></div></dl></article>)}</div></Card>;
}

export function OrderSummary({ context }: { context: OrderContext }) {
  const readiness = getShipmentReadiness(context); const paid = context.order.paidAmount ?? 0;
  return <div className="order-summary-band">{[
    ["PO Value", formatOrderValue(context.order.amount, context.order.currency), "订单金额"], ["Required Delivery", context.order.deliveryDate || "待确认", "要求交期"],
    ["Production", `${context.order.production?.progress ?? 0}%`, context.order.production?.status ?? "Not Started"], ["Approval", context.order.approvals?.filter((item) => item.status === "Approved").length + "/" + (context.order.approvals?.length ?? 0), readiness.status],
    ["Shipment", context.shipment?.status ?? "Pending", context.shipment?.etd ?? "ETD 待确认"], ["Payment", formatOrderValue(paid, context.order.currency), String(context.order.paymentStatus)],
  ].map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>;
}

export function OrderOverview({ context }: { context: OrderContext }) {
  const health = getOrderHealth(context); const readiness = getShipmentReadiness(context); const next = getOrderNextActions(context)[0];
  return <div className="order-overview-grid"><Card className="order-section"><div className="order-section-head"><div><span>WHERE ARE WE NOW?</span><h2>当前执行状态 / Current Position</h2></div><Badge>{context.order.currentStage}</Badge></div><div className="order-overview-copy"><h3>{health.reason}</h3><p>合同：{context.contract?.status ?? "待建立"} · 生产：{context.order.production?.status ?? "Not Started"} · 出货准备：{readiness.status}</p><dl><div><dt>What is blocking?</dt><dd>{readiness.reasons[0] ?? "当前没有阻塞项。"}</dd></div><div><dt>What happens next?</dt><dd>{next?.action ?? "等待下一业务节点"}</dd></div><div><dt>Will we hit delivery?</dt><dd>{health.status === "On Track" ? "当前计划支持按期交付。" : "需要先处理当前风险后再确认。"}</dd></div></dl></div></Card><DocumentsCheck context={context} /></div>;
}

export function POContract({ context }: { context: OrderContext }) {
  const order = context.order; const contract = context.contract;
  return <div className="order-tab-stack"><OrderSection index="01" title="采购订单 / Purchase Order" subtitle="Synthetic commercial record"><div className="order-info-grid">{[
    ["PO Number", order.poNumber], ["PO Date", order.poDate], ["Client", context.client?.name ?? "匿名客户"], ["Project", `${context.project?.code} · ${context.project?.name}`], ["Currency", order.currency], ["Payment Term", order.paymentTerm ?? "尚未确认"], ["Incoterm", order.incoterm ?? "尚未确认"], ["Required Delivery", order.deliveryDate || "尚未确认"], ["Ship To", order.shipTo ?? "尚未确认"],
  ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="order-inner-scroll"><table className="order-detail-table"><thead><tr><th>产品 / Product</th><th>规格 / Specification</th><th>数量 / Quantity</th><th>单价 / Unit Price</th><th>金额 / Amount</th></tr></thead><tbody>{context.lines.map((line) => <tr key={line.id}><td>{line.product}</td><td>{line.specification}</td><td>{line.quantity.toLocaleString("en-US")} {line.unit}</td><td>{order.currency} {line.unitPrice.toFixed(2)}</td><td>{formatOrderValue(line.amount, order.currency)}</td></tr>)}</tbody></table></div></OrderSection>
    <OrderSection index="02" title="合同 / Contract" subtitle="No electronic signature in prototype"><div className="order-info-grid">{[["Contract ID", contract?.contractNumber ?? "待创建"], ["Status", contract?.status ?? "Draft"], ["Created Date", contract?.createdDate ?? "待确认"], ["Signed Date", contract?.signedDate ?? "尚未签署"], ["Payment Term", contract?.paymentTerm ?? order.paymentTerm ?? "尚未确认"], ["Incoterm", contract?.incoterm ?? order.incoterm ?? "尚未确认"], ["Contract Value", contract?.contractValue ? formatOrderValue(contract.contractValue, order.currency) : "尚未确认"], ["Owner", contract?.owner ?? order.owner]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>{contract && !["Confirmed", "Signed"].includes(contract.status) && <p className="order-block-note">当前阻塞：合同尚未确认，生产执行依据需要完成复核。</p>}</OrderSection>
  </div>;
}

export function ProductionPanel({ context, onUpdateMilestone }: { context: OrderContext; onUpdateMilestone: (milestone: ProductionMilestone) => void }) {
  const production = context.order.production;
  return <div className="order-tab-stack"><OrderSection index="01" title="生产状态 / Production Status" subtitle="Progress is derived from completed milestones"><div className="production-summary"><div><span>Production Unit</span><strong>{production?.factory ?? "待分配"}</strong></div><div><span>Status</span><strong>{production?.status ?? "Not Started"}</strong></div><div><span>Start</span><strong>{production?.startDate ?? "待确认"}</strong></div><div><span>Target Completion</span><strong>{production?.targetCompletion ?? "待确认"}</strong></div><div><span>Quantity</span><strong>{production?.quantity.toLocaleString("en-US") ?? "待确认"}</strong></div><div><span>Completed</span><strong>{production?.completedQuantity.toLocaleString("en-US") ?? 0}</strong></div></div><div className="order-progress"><span style={{ width: `${production?.progress ?? 0}%` }} /><small>{production?.progress ?? 0}%</small></div></OrderSection>
    <OrderSection index="02" title="生产节点 / Production Milestones" subtitle="Know where execution is blocked"><div className="order-inner-scroll"><table className="order-detail-table milestone-table"><thead><tr><th>Milestone</th><th>Target</th><th>Actual</th><th>Owner</th><th>Dependency</th><th>Status</th><th>Action</th></tr></thead><tbody>{context.order.productionMilestones?.map((item) => <tr key={item.id}><td><strong>{item.label}</strong></td><td>{item.targetDate}</td><td>{item.actualDate ?? "—"}</td><td>{item.owner}</td><td>{item.dependency ?? "—"}</td><td><Badge>{item.status}</Badge></td><td>{item.status !== "Completed" ? <Button variant="secondary" onClick={() => onUpdateMilestone(item)}>更新 / Update</Button> : "完成"}</td></tr>) ?? <tr><td colSpan={7}>当前订单尚未建立生产节点。</td></tr>}</tbody></table></div></OrderSection></div>;
}

export function ApprovalPanel({ context, onApproval }: { context: OrderContext; onApproval: (approval: OrderApproval) => void }) {
  const readiness = getShipmentReadiness(context);
  return <div className="order-tab-stack"><OrderSection index="01" title="审批中心 / Approval Center" subtitle="Blocking approvals gate shipment readiness"><div className="approval-list">{context.order.approvals?.map((item) => <article key={item.id}><div><strong>{item.type}</strong><Badge>{item.status}</Badge></div><p>{item.requirement}</p><small>{item.owner} · {item.date ?? "待完成"}</small><span>{item.note}</span>{!(["Approved", "Not Required"].includes(item.status)) && <Button variant="secondary" onClick={() => onApproval(item)}>记录审批 / Update</Button>}</article>) ?? <p>当前订单尚未建立审批项。</p>}</div></OrderSection>
    <OrderSection index="02" title="出货准备度 / Shipment Readiness" subtitle="Deterministic rule check"><div className="shipment-readiness"><Badge>{readiness.status}</Badge>{readiness.checks.map((item) => <p key={item.label}><span>{item.ready ? "✓" : "○"}</span><strong>{item.label}</strong><small>{item.ready ? "Ready" : item.blocking ? "Blocking" : "Pending"}</small></p>)}</div></OrderSection></div>;
}

export function DeliveryShipmentPanel({ context }: { context: OrderContext }) {
  const delivery = context.delivery; const shipment = context.shipment;
  const shipSteps = [["Booking", shipment?.bookingDate, shipment?.status === "Pending" ? "Pending" : "Completed"], ["Cargo Ready", shipment?.cargoReadyDate, shipment?.cargoReadyDate ? "Completed" : "Pending"], ["Departed", shipment?.departedDate ?? shipment?.etd, shipment?.departedDate ? "Completed" : "Pending"], ["In Transit", shipment?.status === "In Transit" ? shipment?.etd : undefined, shipment?.status === "In Transit" ? "Current" : "Pending"], ["Delivered", shipment?.deliveredDate, shipment?.status === "Delivered" ? "Completed" : "Pending"]];
  return <div className="order-tab-stack"><OrderSection index="01" title="交付计划 / Delivery Plan" subtitle="Order-level execution only"><div className="order-info-grid">{[["Delivery ID", delivery?.id ?? "待创建"], ["Planned Date", delivery?.plannedDate ?? context.order.deliveryDate], ["Actual Date", delivery?.actualDate ?? "—"], ["Quantity", delivery?.quantity.toLocaleString("en-US") ?? "待确认"], ["Destination", delivery?.destination ?? context.order.shipTo ?? "待确认"], ["Method", delivery?.method ?? "待确认"], ["Status", delivery?.status ?? "Planned"]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></OrderSection>
    <OrderSection index="02" title="出货 / Shipment" subtitle="Synthetic logistics record"><div className="order-info-grid">{[["Shipment ID", shipment?.id ?? "待创建"], ["Shipping Method", shipment?.method ?? "待确认"], ["Carrier", shipment?.carrier ?? "待确认"], ["Tracking / Reference", shipment?.reference ?? shipment?.trackingNumber ?? "待确认"], ["ETD", shipment?.etd ?? "待确认"], ["ETA", shipment?.eta ?? "待确认"], ["Destination", shipment?.destination ?? "待确认"], ["Status", shipment?.status ?? "Pending"]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="shipment-timeline">{shipSteps.map(([label, date, status]) => <article key={label}><i>{status === "Completed" ? "✓" : ""}</i><div><strong>{label}</strong><span>{date ?? "待确认"}</span><small>{status}</small></div></article>)}</div></OrderSection></div>;
}

export function PaymentPanel({ context }: { context: OrderContext }) {
  const order = context.order; const paid = order.paidAmount ?? 0; const outstanding = Math.max(0, order.amount - paid); const risk = getPaymentRisk(order);
  return <OrderSection index="01" title="回款 / Payment" subtitle="Prototype record; no banking integration"><div className="payment-ledger"><div><span>Payment Term</span><strong>{order.paymentTerm ?? "尚未确认"}</strong></div><div><span>Total Amount</span><strong>{formatOrderValue(order.amount, order.currency)}</strong></div><div><span>Paid Amount</span><strong>{formatOrderValue(paid, order.currency)}</strong></div><div><span>Outstanding</span><strong>{formatOrderValue(outstanding, order.currency)}</strong></div><div><span>Expected Payment Date</span><strong>{order.expectedPaymentDate ?? "尚未确认"}</strong></div><div><span>Status</span><strong>{order.paymentStatus}</strong></div></div><p className="payment-risk"><Badge>{risk.level}</Badge>{risk.reason}</p></OrderSection>;
}

export function OrderTimeline({ context }: { context: OrderContext }) {
  const [filter, setFilter] = useState<TimelineFilter>("All"); const filters: TimelineFilter[] = ["All", "Commercial", "Production", "Quality", "Logistics", "Payment"];
  const events = [...(context.order.executionTimeline ?? [])].filter((item) => filter === "All" || item.category === filter).sort((a, b) => b.date.localeCompare(a.date));
  return <OrderSection index="01" title="订单时间线 / Order Timeline" subtitle="Commercial, production, quality, logistics and payment"><div className="order-filter-row timeline-filters">{filters.map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="order-event-list">{events.map((event) => <article key={event.id}><time>{event.date}</time><i /><div><Badge>{event.category}</Badge><strong>{event.title}</strong><p>{event.detail}</p></div></article>)}{events.length === 0 && <p>当前筛选下没有时间线记录。</p>}</div></OrderSection>;
}

export function OrderSidebar({ context, onComplete }: { context: OrderContext; onComplete: () => void }) {
  const health = getOrderHealth(context); const path = getCriticalPath(context); const risks = getExecutionRisks(context); const actions = getOrderNextActions(context); const completable = canCompleteOrder(context);
  const priority = health.status === "At Risk" || health.status === "Blocked" ? risks[0]?.issue ?? health.reason : actions[0]?.action ?? "推进下一里程碑";
  return <>
    <Card className="order-health-card"><div className="order-section-head"><div><span>ORDER HEALTH</span><h2>订单健康度</h2></div><span className={`order-health-label health-${health.status.toLowerCase().replaceAll(" ", "-")}`}>{health.status}</span></div><p>{health.reason}</p></Card>
    <section className="order-critical"><div className="order-section-head"><div><span>{health.status === "On Track" ? "CURRENT EXECUTION PLAN" : "CRITICAL EXECUTION RISK"}</span><h2>{health.status === "On Track" ? "当前执行计划" : "关键执行风险"}</h2></div></div><strong>{priority}</strong><p>{health.status === "On Track" ? "按当前节点顺序推进，并保持交期依赖可见。" : "该事项需要优先处理，避免影响 Required Delivery Date。"}</p></section>
    <Card className="critical-path"><div className="order-section-head"><div><span>CRITICAL PATH</span><h2>关键路径</h2></div></div>{path.map((item, index) => <article key={`${item.label}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.label}</strong><p>{item.status} · {item.date}</p></div></article>)}</Card>
    <Card className="execution-risks"><div className="order-section-head"><div><span>EXECUTION RISKS</span><h2>执行风险</h2></div><small>{risks.length}</small></div>{risks.map((risk) => <article key={risk.id}><div><Badge>{risk.severity}</Badge><strong>{risk.type}</strong></div><p>{risk.issue}</p><dl><div><dt>Impact</dt><dd>{risk.impact}</dd></div><div><dt>Owner</dt><dd>{risk.owner}</dd></div><div><dt>Action</dt><dd>{risk.action}</dd></div></dl></article>)}</Card>
    <Card className="order-next-actions"><div className="order-section-head"><div><span>NEXT BEST ACTION</span><h2>下一步行动</h2></div></div>{actions.map((item, index) => <article key={item.action}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.action}</strong><p>{item.why}</p><small>{item.owner} · {item.timing}</small></div></article>)}{completable && <Button onClick={onComplete}>标记完成 / Mark Completed</Button>}</Card>
  </>;
}

function DocumentsCheck({ context }: { context: OrderContext }) { return <Card className="order-section"><div className="order-section-head"><div><span>DOCUMENT READINESS</span><h2>文件检查 / Documents</h2></div></div><div className="document-checks">{context.order.documents?.map((item) => <p key={item.id}><strong>{item.name}</strong><Badge>{item.status}</Badge></p>) ?? <p>尚未建立文件检查。</p>}</div></Card>; }
function OrderSection({ index, title, subtitle, children }: { index: string; title: string; subtitle: string; children: ReactNode }) { return <Card className="order-section"><div className="order-section-head"><div><span>{index} · {subtitle}</span><h2>{title}</h2></div></div>{children}</Card>; }
