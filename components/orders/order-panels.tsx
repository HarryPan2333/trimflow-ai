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
import { useI18n } from "../providers/language-provider";

export function OrderLifecycle({ context }: { context: OrderContext }) {
  const { language, t, label, text, formatDate } = useI18n();
  return <Card className="order-lifecycle"><div className="order-section-head"><div><span>{t("order.executionLifecycleLabel")}</span><h2>{t("order.lifecycle")}</h2></div><Badge>{label(context.order.currentStage)}</Badge></div><div className="order-lifecycle-scroll">{getLifecycle(context, language).map((item, index) => <article className={`order-life-${item.status.toLowerCase()}`} key={item.stage}><div><span>{String(index + 1).padStart(2, "0")}</span><i>{item.status === "Completed" ? "✓" : item.status === "Blocked" ? "!" : ""}</i></div><strong>{label(item.stage)}</strong><small>{label(item.status)}</small><dl><div><dt>{t("common.owner")}</dt><dd>{text(item.owner)}</dd></div><div><dt>{t("common.target")}</dt><dd>{formatDate(item.targetDate)}</dd></div>{item.actualDate && <div><dt>{t("common.actual")}</dt><dd>{formatDate(item.actualDate)}</dd></div>}<div><dt>{t("common.dependency")}</dt><dd>{text(item.dependency)}</dd></div></dl></article>)}</div></Card>;
}

export function OrderSummary({ context }: { context: OrderContext }) {
  const { language, t, label, formatDate } = useI18n();
  const readiness = getShipmentReadiness(context, language); const paid = context.order.paidAmount ?? 0;
  return <div className="order-summary-band">{[
    [t("order.amount"), formatOrderValue(context.order.amount, context.order.currency), "PO"], [t("order.requiredDelivery"), context.order.deliveryDate ? formatDate(context.order.deliveryDate) : t("common.notConfirmed"), "ETA"],
    [t("order.production"), `${context.order.production?.progress ?? 0}%`, label(context.order.production?.status ?? "Not Started")], [t("order.approval"), context.order.approvals?.filter((item) => item.status === "Approved").length + "/" + (context.order.approvals?.length ?? 0), label(readiness.status)],
    [t("order.shipment"), label(context.shipment?.status ?? "Pending"), context.shipment?.etd ? `ETD ${formatDate(context.shipment.etd)}` : `ETD · ${t("common.notConfirmed")}`], [t("order.payment"), formatOrderValue(paid, context.order.currency), label(String(context.order.paymentStatus))],
  ].map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>;
}

export function OrderOverview({ context }: { context: OrderContext }) {
  const { language, t, label, text } = useI18n();
  const health = getOrderHealth(context, language); const readiness = getShipmentReadiness(context, language); const next = getOrderNextActions(context, language)[0];
  return <div className="order-overview-grid"><Card className="order-section"><div className="order-section-head"><div><span>{t("order.currentPositionLabel")}</span><h2>{t("order.currentPosition")}</h2></div><Badge>{label(context.order.currentStage)}</Badge></div><div className="order-overview-copy"><h3>{text(health.reason)}</h3><p>{t("order.contract")}: {label(context.contract?.status ?? "Pending")} · {t("order.production")}: {label(context.order.production?.status ?? "Not Started")} · {t("order.shipmentReadiness")}: {label(readiness.status)}</p><dl><div><dt>{t("order.whatBlocking")}</dt><dd>{text(readiness.reasons[0] ?? t("order.noBlockers"))}</dd></div><div><dt>{t("order.whatNext")}</dt><dd>{text(next?.action ?? t("order.nextMilestoneFallback"))}</dd></div><div><dt>{t("order.hitDelivery")}</dt><dd>{health.status === "On Track" ? t("order.currentPlanSupport") : t("order.resolveBeforeDelivery")}</dd></div></dl></div></Card><DocumentsCheck context={context} /></div>;
}

export function POContract({ context }: { context: OrderContext }) {
  const order = context.order; const contract = context.contract;
  const { language, t, label, text, formatDate } = useI18n();
  return <div className="order-tab-stack"><OrderSection index="01" title="PO" subtitle={t("order.syntheticCommercial")}><div className="order-info-grid">{[
    [t("order.poNumber"), order.poNumber], [t("order.poDate"), formatDate(order.poDate)], [t("common.client"), text(context.client?.name ?? t("order.anonymousClient"))], [t("common.project"), `${context.project?.code} · ${text(context.project?.name ?? "")}`], [t("common.currency"), order.currency], [t("common.paymentTerm"), order.paymentTerm ?? t("common.notConfirmed")], [t("quotation.incoterm"), order.incoterm ?? t("common.notConfirmed")], [t("order.requiredDelivery"), order.deliveryDate ? formatDate(order.deliveryDate) : t("common.notConfirmed")], [t("order.shipTo"), text(order.shipTo ?? t("common.notConfirmed"))],
  ].map(([field, value]) => <div key={field}><span>{field}</span><strong>{value}</strong></div>)}</div><div className="order-inner-scroll"><table className="order-detail-table"><thead><tr><th>{t("common.product")}</th><th>{t("common.specification")}</th><th>{t("common.quantity")}</th><th>{t("common.unitPrice")}</th><th>{t("common.amount")}</th></tr></thead><tbody>{context.lines.map((line) => <tr key={line.id}><td>{text(line.product)}</td><td>{text(line.specification)}</td><td>{line.quantity.toLocaleString("en-US")} {label(line.unit)}</td><td>{order.currency} {line.unitPrice.toFixed(2)}</td><td>{formatOrderValue(line.amount, order.currency)}</td></tr>)}</tbody></table></div></OrderSection>
    <OrderSection index="02" title={t("order.contract")} subtitle={t("order.noESign")}><div className="order-info-grid">{[[t("order.contractId"), contract?.contractNumber ?? t("common.notCreated")], [t("common.status"), label(contract?.status ?? "Draft")], [t("common.createdDate"), contract?.createdDate ? formatDate(contract.createdDate) : t("common.notConfirmed")], [t("common.signedDate"), contract?.signedDate ? formatDate(contract.signedDate) : t("common.notSigned")], [t("common.paymentTerm"), contract?.paymentTerm ?? order.paymentTerm ?? t("common.notConfirmed")], [t("quotation.incoterm"), contract?.incoterm ?? order.incoterm ?? t("common.notConfirmed")], [t("order.contractValue"), contract?.contractValue ? formatOrderValue(contract.contractValue, order.currency) : t("common.notConfirmed")], [t("common.owner"), text(contract?.owner ?? order.owner)]].map(([field, value]) => <div key={field}><span>{field}</span><strong>{value}</strong></div>)}</div>{contract && !["Confirmed", "Signed"].includes(contract.status) && <p className="order-block-note">{language === "en" ? "The contract is not confirmed, so the production execution basis is incomplete." : "合同尚未确认，生产执行依据不完整。"}</p>}</OrderSection>
  </div>;
}

export function ProductionPanel({ context, onUpdateMilestone }: { context: OrderContext; onUpdateMilestone: (milestone: ProductionMilestone) => void }) {
  const production = context.order.production;
  const { t, label, text, formatDate } = useI18n();
  return <div className="order-tab-stack"><OrderSection index="01" title={t("order.productionStatus")} subtitle={t("order.progressDerived")}><div className="production-summary"><div><span>{t("order.productionUnit")}</span><strong>{production?.factory ?? t("common.notAssigned")}</strong></div><div><span>{t("common.status")}</span><strong>{label(production?.status ?? "Not Started")}</strong></div><div><span>{t("order.startDate")}</span><strong>{production?.startDate ? formatDate(production.startDate) : t("common.notConfirmed")}</strong></div><div><span>{t("order.targetCompletion")}</span><strong>{production?.targetCompletion ? formatDate(production.targetCompletion) : t("common.notConfirmed")}</strong></div><div><span>{t("common.quantity")}</span><strong>{production?.quantity.toLocaleString("en-US") ?? t("common.notConfirmed")}</strong></div><div><span>{t("order.completedQuantity")}</span><strong>{production?.completedQuantity.toLocaleString("en-US") ?? 0}</strong></div></div><div className="order-progress"><span style={{ width: `${production?.progress ?? 0}%` }} /><small>{production?.progress ?? 0}%</small></div></OrderSection>
    <OrderSection index="02" title={t("order.productionMilestones")} subtitle={t("order.milestoneHelp")}><div className="order-inner-scroll"><table className="order-detail-table milestone-table"><thead><tr><th>{t("order.nextMilestone")}</th><th>{t("common.target")}</th><th>{t("common.actual")}</th><th>{t("common.owner")}</th><th>{t("common.dependency")}</th><th>{t("common.status")}</th><th>{t("common.action")}</th></tr></thead><tbody>{context.order.productionMilestones?.map((item) => <tr key={item.id}><td><strong>{text(item.label)}</strong></td><td>{formatDate(item.targetDate)}</td><td>{item.actualDate ? formatDate(item.actualDate) : "—"}</td><td>{item.owner}</td><td>{text(item.dependency ?? "—")}</td><td><Badge>{label(item.status)}</Badge></td><td>{item.status !== "Completed" ? <Button variant="secondary" onClick={() => onUpdateMilestone(item)}>{t("actions.update")}</Button> : label("Completed")}</td></tr>) ?? <tr><td colSpan={7}>{t("order.noProductionMilestones")}</td></tr>}</tbody></table></div></OrderSection></div>;
}

export function ApprovalPanel({ context, onApproval }: { context: OrderContext; onApproval: (approval: OrderApproval) => void }) {
  const { language, t, label, text, formatDate } = useI18n();
  const readiness = getShipmentReadiness(context, language);
  return <div className="order-tab-stack"><OrderSection index="01" title={t("order.approvalCenter")} subtitle={t("order.approvalBlockingHelp")}><div className="approval-list">{context.order.approvals?.map((item) => <article key={item.id}><div><strong>{label(item.type)}</strong><Badge>{label(item.status)}</Badge></div><p>{text(item.requirement)}</p><small>{item.owner} · {item.date ? formatDate(item.date) : t("common.pendingConfirmation")}</small><span>{text(item.note)}</span>{!(["Approved", "Not Required"].includes(item.status)) && <Button variant="secondary" onClick={() => onApproval(item)}>{t("actions.update")}</Button>}</article>) ?? <p>{t("order.noApprovals")}</p>}</div></OrderSection>
    <OrderSection index="02" title={t("order.shipmentReadiness")} subtitle={t("order.ruleCheck")}><div className="shipment-readiness"><Badge>{label(readiness.status)}</Badge>{readiness.checks.map((item) => <p key={item.label}><span>{item.ready ? "✓" : "○"}</span><strong>{text(item.label)}</strong><small>{label(item.ready ? "Ready" : item.blocking ? "Blocking" : "Pending")}</small></p>)}</div></OrderSection></div>;
}

export function DeliveryShipmentPanel({ context }: { context: OrderContext }) {
  const delivery = context.delivery; const shipment = context.shipment;
  const { t, label, text, formatDate } = useI18n();
  const shipSteps: Array<[string, string | undefined, string]> = [["Booking", shipment?.bookingDate, shipment?.status === "Pending" ? "Pending" : "Completed"], ["Cargo Ready", shipment?.cargoReadyDate, shipment?.cargoReadyDate ? "Completed" : "Pending"], ["Departed", shipment?.departedDate ?? shipment?.etd, shipment?.departedDate ? "Completed" : "Pending"], ["In Transit", shipment?.status === "In Transit" ? shipment?.etd : undefined, shipment?.status === "In Transit" ? "Current" : "Pending"], ["Delivered", shipment?.deliveredDate, shipment?.status === "Delivered" ? "Completed" : "Pending"]];
  return <div className="order-tab-stack"><OrderSection index="01" title={t("order.deliveryPlan")} subtitle={t("order.orderLevelOnly")}><div className="order-info-grid">{[[t("order.deliveryId"), delivery?.id ?? t("common.notCreated")], [t("order.plannedDate"), delivery?.plannedDate ? formatDate(delivery.plannedDate) : context.order.deliveryDate ? formatDate(context.order.deliveryDate) : t("common.notConfirmed")], [t("order.actualDateShort"), delivery?.actualDate ? formatDate(delivery.actualDate) : "—"], [t("common.quantity"), delivery?.quantity.toLocaleString("en-US") ?? t("common.notConfirmed")], [t("common.destination"), text(delivery?.destination ?? context.order.shipTo ?? t("common.notConfirmed"))], [t("common.method"), text(delivery?.method ?? t("common.notConfirmed"))], [t("common.status"), label(delivery?.status ?? "Planned")]].map(([field, value]) => <div key={field}><span>{field}</span><strong>{value}</strong></div>)}</div></OrderSection>
    <OrderSection index="02" title={t("order.shipment")} subtitle={t("order.syntheticLogistics")}><div className="order-info-grid">{[[t("order.shipmentId"), shipment?.id ?? t("common.notCreated")], [t("order.shippingMethod"), text(shipment?.method ?? t("common.notConfirmed"))], [t("common.carrier"), shipment?.carrier ?? t("common.notConfirmed")], [t("order.trackingReference"), shipment?.reference ?? shipment?.trackingNumber ?? t("common.notConfirmed")], ["ETD", shipment?.etd ? formatDate(shipment.etd) : t("common.notConfirmed")], ["ETA", shipment?.eta ? formatDate(shipment.eta) : t("common.notConfirmed")], [t("common.destination"), text(shipment?.destination ?? t("common.notConfirmed"))], [t("common.status"), label(shipment?.status ?? "Pending")]].map(([field, value]) => <div key={field}><span>{field}</span><strong>{value}</strong></div>)}</div><div className="shipment-timeline">{shipSteps.map(([step, date, status]) => <article key={step}><i>{status === "Completed" ? "✓" : ""}</i><div><strong>{label(step)}</strong><span>{date ? formatDate(date) : t("common.notConfirmed")}</span><small>{label(status)}</small></div></article>)}</div></OrderSection></div>;
}

export function PaymentPanel({ context }: { context: OrderContext }) {
  const { language, t, label, text, formatDate } = useI18n();
  const order = context.order; const paid = order.paidAmount ?? 0; const outstanding = Math.max(0, order.amount - paid); const risk = getPaymentRisk(order, language);
  return <OrderSection index="01" title={t("order.payment")} subtitle={t("order.prototypeBanking")}><div className="payment-ledger"><div><span>{t("common.paymentTerm")}</span><strong>{order.paymentTerm ?? t("common.notConfirmed")}</strong></div><div><span>{t("common.total")}</span><strong>{formatOrderValue(order.amount, order.currency)}</strong></div><div><span>{t("common.paid")}</span><strong>{formatOrderValue(paid, order.currency)}</strong></div><div><span>{t("common.outstanding")}</span><strong>{formatOrderValue(outstanding, order.currency)}</strong></div><div><span>{t("order.expectedPaymentDate")}</span><strong>{order.expectedPaymentDate ? formatDate(order.expectedPaymentDate) : t("common.notConfirmed")}</strong></div><div><span>{t("common.status")}</span><strong>{label(String(order.paymentStatus))}</strong></div></div><p className="payment-risk"><Badge>{label(risk.level)}</Badge>{text(risk.reason)}</p></OrderSection>;
}

export function OrderTimeline({ context }: { context: OrderContext }) {
  const [filter, setFilter] = useState<TimelineFilter>("All"); const filters: TimelineFilter[] = ["All", "Commercial", "Production", "Quality", "Logistics", "Payment"];
  const events = [...(context.order.executionTimeline ?? [])].filter((item) => filter === "All" || item.category === filter).sort((a, b) => b.date.localeCompare(a.date));
  const { t, label, text, formatDate } = useI18n();
  return <OrderSection index="01" title={t("order.orderTimeline")} subtitle={t("order.timelineScope")}><div className="order-filter-row timeline-filters">{filters.map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{label(item)}</button>)}</div><div className="order-event-list">{events.map((event) => <article key={event.id}><time>{formatDate(event.date)}</time><i /><div><Badge>{label(event.category)}</Badge><strong>{text(event.title)}</strong><p>{text(event.detail)}</p></div></article>)}{events.length === 0 && <p>{t("order.noTimeline")}</p>}</div></OrderSection>;
}

export function OrderSidebar({ context, onComplete }: { context: OrderContext; onComplete: () => void }) {
  const { language, t, label, text, formatDate } = useI18n();
  const health = getOrderHealth(context, language); const path = getCriticalPath(context, language); const risks = getExecutionRisks(context, language); const actions = getOrderNextActions(context, language); const completable = canCompleteOrder(context);
  const priority = health.status === "At Risk" || health.status === "Blocked" ? risks[0]?.issue ?? health.reason : actions[0]?.action ?? t("order.nextMilestoneFallback");
  return <>
    <Card className="order-health-card"><div className="order-section-head"><div><span>{t("order.healthLabel")}</span><h2>{t("order.health")}</h2></div><span className={`order-health-label health-${health.status.toLowerCase().replaceAll(" ", "-")}`}>{label(health.status)}</span></div><p>{text(health.reason)}</p></Card>
    <section className="order-critical"><div className="order-section-head"><div><span>{health.status === "On Track" ? t("order.currentExecutionPlan") : t("order.criticalExecutionRisk")}</span><h2>{health.status === "On Track" ? t("order.currentExecutionPlan") : t("order.criticalExecutionRisk")}</h2></div></div><strong>{text(priority)}</strong><p>{health.status === "On Track" ? t("order.onTrackGuidance") : t("order.riskGuidance")}</p></section>
    <Card className="critical-path"><div className="order-section-head"><div><span>{t("order.criticalPathLabel")}</span><h2>{t("order.criticalPath")}</h2></div></div>{path.map((item, index) => <article key={`${item.label}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{label(item.label)}</strong><p>{label(item.status)} · {item.date ? formatDate(item.date) : t("common.notConfirmed")}</p></div></article>)}</Card>
    <Card className="execution-risks"><div className="order-section-head"><div><span>{t("order.risksLabel")}</span><h2>{t("order.executionRisks")}</h2></div><small>{risks.length}</small></div>{risks.map((risk) => <article key={risk.id}><div><Badge>{label(risk.severity)}</Badge><strong>{label(risk.type)}</strong></div><p>{text(risk.issue)}</p><dl><div><dt>{t("common.impact")}</dt><dd>{text(risk.impact)}</dd></div><div><dt>{t("common.owner")}</dt><dd>{text(risk.owner)}</dd></div><div><dt>{t("common.action")}</dt><dd>{text(risk.action)}</dd></div></dl></article>)}</Card>
    <Card className="order-next-actions"><div className="order-section-head"><div><span>{t("order.nextActionLabel")}</span><h2>{t("order.nextBestAction")}</h2></div></div>{actions.map((item, index) => <article key={item.action}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{text(item.action)}</strong><p>{text(item.why)}</p><small>{text(item.owner)} · {text(item.timing)}</small></div></article>)}{completable && <Button onClick={onComplete}>{t("actions.markCompleted")}</Button>}</Card>
  </>;
}

function DocumentsCheck({ context }: { context: OrderContext }) { const { t, label, text } = useI18n(); return <Card className="order-section"><div className="order-section-head"><div><span>{t("order.documentReadinessLabel")}</span><h2>{t("order.documents")}</h2></div></div><div className="document-checks">{context.order.documents?.map((item) => <p key={item.id}><strong>{text(item.name)}</strong><Badge>{label(item.status)}</Badge></p>) ?? <p>{t("order.noDocuments")}</p>}</div></Card>; }
function OrderSection({ index, title, subtitle, children }: { index: string; title: string; subtitle: string; children: ReactNode }) { return <Card className="order-section"><div className="order-section-head"><div><span>{index} · {subtitle}</span><h2>{title}</h2></div></div>{children}</Card>; }
