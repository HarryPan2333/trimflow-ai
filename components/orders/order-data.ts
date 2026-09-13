import {
  clients,
  contracts,
  deliveries,
  orderLines,
  projects,
  purchaseOrders,
  shipments,
} from "../../lib/mock-data";
import type {
  Client,
  Contract,
  Delivery,
  OrderApproval,
  OrderHealth,
  OrderIssue,
  OrderLine,
  OrderStage,
  OrderTimelineEvent,
  PaymentStatus,
  Project,
  PurchaseOrder,
  Quotation,
  Shipment,
} from "../../lib/mock-data";
import type { QuotationWorkspace } from "../quotations/quotation-data";
import { DEMO_DATE } from "../samples/sample-data";

export type OrderWorkspace = {
  orders: PurchaseOrder[];
  lines: OrderLine[];
  contracts: Contract[];
  deliveries: Delivery[];
  shipments: Shipment[];
};

export type OrderContext = {
  order: PurchaseOrder;
  client?: Client;
  project?: Project;
  quotation?: Quotation;
  lines: OrderLine[];
  contract?: Contract;
  delivery?: Delivery;
  shipment?: Shipment;
};

export type OrderFilter = "All" | "Active" | "At Risk" | "Shipping Soon" | "Completed";
export type TimelineFilter = "All" | OrderTimelineEvent["category"];

export type OrderAction =
  | { type: "create"; order: PurchaseOrder; lines: OrderLine[]; contract: Contract; delivery: Delivery; shipment: Shipment }
  | { type: "update"; id: string; changes: Partial<PurchaseOrder> }
  | { type: "milestone"; id: string; milestoneId: string; actualDate: string }
  | { type: "approval"; id: string; approvalId: string; status: OrderApproval["status"]; note: string }
  | { type: "issue"; id: string; issue: OrderIssue }
  | { type: "shipment"; id: string; shipment: Shipment }
  | { type: "payment"; id: string; paidAmount: number; expectedPaymentDate: string }
  | { type: "event"; id: string; event: OrderTimelineEvent }
  | { type: "complete"; id: string };

export function createOrderWorkspace(): OrderWorkspace {
  return {
    orders: structuredClone(purchaseOrders),
    lines: structuredClone(orderLines),
    contracts: structuredClone(contracts),
    deliveries: structuredClone(deliveries),
    shipments: structuredClone(shipments),
  };
}

export function orderWorkspaceReducer(state: OrderWorkspace, action: OrderAction): OrderWorkspace {
  if (action.type === "create") {
    if (state.orders.some((item) => item.quotationId === action.order.quotationId)) return state;
    return { orders: [...state.orders, action.order], lines: [...state.lines, ...action.lines], contracts: [...state.contracts, action.contract], deliveries: [...state.deliveries, action.delivery], shipments: [...state.shipments, action.shipment] };
  }
  const order = state.orders.find((item) => item.id === action.id);
  if (!order) return state;
  const updateOrder = (changes: Partial<PurchaseOrder>) => state.orders.map((item) => item.id === action.id ? { ...item, ...changes } : item);
  if (action.type === "update") return { ...state, orders: updateOrder(action.changes) };
  if (action.type === "milestone") {
    const milestones = order.productionMilestones?.map((item) => item.id === action.milestoneId ? { ...item, actualDate: action.actualDate, status: "Completed" as const } : item);
    const completed = milestones?.filter((item) => item.status === "Completed").length ?? 0;
    const progress = milestones?.length ? Math.round(completed / milestones.length * 100) : order.production?.progress ?? 0;
    const production = order.production ? { ...order.production, progress, completedQuantity: Math.round(order.production.quantity * progress / 100), status: progress === 100 ? "Completed" as const : progress > 0 ? "In Production" as const : order.production.status } : undefined;
    return { ...state, orders: updateOrder({ productionMilestones: milestones, production, currentStage: progress === 100 ? "Approval" : "Production", executionTimeline: appendEvent(order, { id: `oe-${action.milestoneId}-${action.actualDate}`, category: "Production", date: action.actualDate, title: `${milestones?.find((item) => item.id === action.milestoneId)?.label ?? "Milestone"} Completed`, detail: "生产节点已在演示工作区标记完成。" }) }) };
  }
  if (action.type === "approval") {
    const approvals = order.approvals?.map((item) => item.id === action.approvalId ? { ...item, status: action.status, date: DEMO_DATE, note: action.note } : item);
    return { ...state, orders: updateOrder({ approvals, currentStage: action.status === "Approved" ? "Approval" : order.currentStage, executionTimeline: appendEvent(order, { id: `oe-${action.approvalId}-${DEMO_DATE}`, category: "Quality", date: DEMO_DATE, title: `${approvals?.find((item) => item.id === action.approvalId)?.type ?? "Approval"} · ${action.status}`, detail: action.note }) }) };
  }
  if (action.type === "issue") return { ...state, orders: updateOrder({ issues: [...(order.issues ?? []), action.issue] }) };
  if (action.type === "shipment") return { ...state, orders: updateOrder({ currentStage: "Shipment", executionTimeline: appendEvent(order, { id: `oe-${action.shipment.id}-shipped`, category: "Logistics", date: action.shipment.departedDate ?? DEMO_DATE, title: "Shipment Departed", detail: `${action.shipment.reference ?? action.shipment.trackingNumber ?? "Demo reference"} · ${action.shipment.destination}` }) }), shipments: state.shipments.some((item) => item.purchaseOrderId === action.id) ? state.shipments.map((item) => item.purchaseOrderId === action.id ? action.shipment : item) : [...state.shipments, action.shipment] };
  if (action.type === "payment") {
    const status: PaymentStatus = action.paidAmount >= order.amount ? "Paid" : action.paidAmount > 0 ? "Partial" : action.expectedPaymentDate < DEMO_DATE ? "Overdue" : "Pending";
    return { ...state, orders: updateOrder({ paidAmount: action.paidAmount, expectedPaymentDate: action.expectedPaymentDate, paymentStatus: status, currentStage: status === "Paid" ? "Payment" : order.currentStage, executionTimeline: appendEvent(order, { id: `oe-payment-${DEMO_DATE}-${action.paidAmount}`, category: "Payment", date: DEMO_DATE, title: status === "Paid" ? "Payment Paid" : "Payment Updated", detail: `${order.currency} ${action.paidAmount.toLocaleString("en-US")} 已记录（演示）。` }) }) };
  }
  if (action.type === "event") return { ...state, orders: updateOrder({ executionTimeline: appendEvent(order, action.event) }) };
  return { ...state, orders: updateOrder({ currentStage: "Completed", executionTimeline: appendEvent(order, { id: `oe-completed-${DEMO_DATE}`, category: "Commercial", date: DEMO_DATE, title: "Order Completed", detail: "出货已送达、回款已完成且无阻塞问题。" }) }) };
}

function appendEvent(order: PurchaseOrder, event: OrderTimelineEvent) {
  return [...(order.executionTimeline ?? []), event];
}

export function getOrderContext(order: PurchaseOrder, workspace: OrderWorkspace, quotationWorkspace: QuotationWorkspace, allProjects: Project[] = projects): OrderContext {
  return {
    order,
    client: clients.find((item) => item.id === order.clientId),
    project: allProjects.find((item) => item.id === order.projectId),
    quotation: quotationWorkspace.quotations.find((item) => item.id === order.quotationId),
    lines: workspace.lines.filter((item) => item.purchaseOrderId === order.id),
    contract: workspace.contracts.find((item) => item.purchaseOrderId === order.id),
    delivery: workspace.deliveries.find((item) => item.purchaseOrderId === order.id),
    shipment: workspace.shipments.find((item) => item.purchaseOrderId === order.id),
  };
}

export function getOrderHealth(context: OrderContext): { status: OrderHealth; reason: string } {
  const order = context.order;
  const blockingIssue = order.issues?.find((item) => item.blocking && !item.resolved);
  if (blockingIssue) return { status: "Blocked", reason: blockingIssue.issue };
  if (order.approvals?.some((item) => item.blocking && item.status === "Revision Required")) return { status: "Blocked", reason: "阻塞审批需要修改，当前不能进入 Ready to Ship。" };
  const overdue = order.productionMilestones?.find((item) => item.status !== "Completed" && item.targetDate < DEMO_DATE);
  if (overdue) return { status: "At Risk", reason: `${overdue.label} 已超过目标日期 ${overdue.targetDate}。` };
  const payment = getPaymentRisk(order);
  if (payment.level === "At Risk") return { status: "At Risk", reason: payment.reason };
  const deliveryDays = daysUntil(order.deliveryDate);
  if (deliveryDays <= 7 && getShipmentReadiness(context).status !== "Ready to Ship") return { status: "At Risk", reason: "交付日期在 7 天内，但出货条件尚未满足。" };
  const upcoming = order.productionMilestones?.find((item) => item.status !== "Completed" && daysUntil(item.targetDate) >= 0 && daysUntil(item.targetDate) <= 7);
  if (upcoming || payment.level === "Attention") return { status: "Attention", reason: upcoming ? `${upcoming.label} 将在 7 天内到期。` : payment.reason };
  return { status: "On Track", reason: "近期关键节点正常，暂无阻塞执行项。" };
}

export function getShipmentReadiness(context: OrderContext) {
  const order = context.order;
  const productionComplete = order.production?.status === "Completed" || (order.production?.progress ?? 0) >= 100;
  const approvalsReady = (order.approvals ?? []).filter((item) => item.blocking).every((item) => ["Approved", "Not Required"].includes(item.status));
  const packingComplete = order.productionMilestones?.find((item) => item.label === "Packing Complete")?.status === "Completed";
  const documentsReady = (order.documents ?? []).filter((item) => ["Commercial Invoice", "Packing List", "Test Report"].includes(item.name)).every((item) => ["Available", "Not Required"].includes(item.status));
  const deliveryInstruction = Boolean(context.delivery?.destination || order.shipTo);
  const checks = [
    { label: "Production Complete", ready: productionComplete, blocking: true },
    { label: "Bulk / Quality / Testing Approval", ready: approvalsReady, blocking: true },
    { label: "Packing Complete", ready: packingComplete, blocking: true },
    { label: "Commercial Documents", ready: documentsReady, blocking: false },
    { label: "Delivery Instruction", ready: deliveryInstruction, blocking: true },
  ];
  const missing = checks.filter((item) => !item.ready);
  return { status: missing.some((item) => item.blocking) ? "Blocked" : missing.length ? "Needs Attention" : "Ready to Ship", checks, reasons: missing.map((item) => `${item.label} 尚未完成`) } as const;
}

export function getPaymentRisk(order: PurchaseOrder) {
  const paid = order.paidAmount ?? (order.paymentStatus === "已付款" ? order.amount : 0);
  if (paid >= order.amount || order.paymentStatus === "Paid") return { level: "Normal", reason: "已完成回款，不再显示回款风险。" } as const;
  if (!order.expectedPaymentDate) return { level: "Attention", reason: "预计回款日期尚未确认。" } as const;
  const days = daysUntil(order.expectedPaymentDate);
  if (days < 0) return { level: "At Risk", reason: `预计回款日已超过 ${Math.abs(days)} 天，仍有未收金额。` } as const;
  if (days <= 7) return { level: "Attention", reason: `预计回款将在 ${days} 天内到期。` } as const;
  return { level: "Normal", reason: `预计回款日为 ${order.expectedPaymentDate}。` } as const;
}

export function getExecutionRisks(context: OrderContext) {
  const risks = [...(context.order.issues ?? []).filter((item) => !item.resolved)];
  const readiness = getShipmentReadiness(context);
  if (readiness.status === "Blocked" && !risks.some((item) => item.type === "Testing")) risks.push({ id: "derived-readiness", type: "Testing", severity: "Medium", issue: "出货准备条件尚未全部满足。", impact: "Shipment readiness blocked.", owner: "Order Operations", action: readiness.reasons[0] ?? "完成出货准备检查。", blocking: false, resolved: false });
  const payment = getPaymentRisk(context.order);
  if (payment.level !== "Normal") risks.push({ id: "derived-payment", type: "Payment", severity: payment.level === "At Risk" ? "High" : "Medium", issue: payment.reason, impact: "可能影响订单安全关闭。", owner: context.order.owner, action: "确认付款计划与到账记录。", blocking: false, resolved: false });
  return risks.slice(0, 4);
}

export function getCriticalPath(context: OrderContext) {
  const order = context.order;
  const nodes = [
    ...(order.approvals ?? []).filter((item) => item.blocking && item.status !== "Approved" && item.status !== "Not Required").slice(0, 1).map((item) => ({ label: item.type, status: item.status, date: item.date ?? "待完成" })),
    ...(order.productionMilestones ?? []).filter((item) => item.status !== "Completed" && ["Bulk Completion", "Packing Complete"].includes(item.label)).map((item) => ({ label: item.label, status: item.status, date: item.targetDate })),
    { label: "Shipment Booking", status: context.shipment?.status === "Pending" ? "Pending" : context.shipment?.status ?? "Pending", date: context.shipment?.etd ?? "待确认" },
    { label: "Required Delivery", status: context.delivery?.status ?? "Planned", date: order.deliveryDate },
  ];
  return nodes.slice(0, 5);
}

export function getOrderNextActions(context: OrderContext) {
  const order = context.order;
  const owner = order.owner;
  const actions: Array<{ action: string; why: string; owner: string; timing: string }> = [];
  if (!context.contract || !["Confirmed", "Signed"].includes(context.contract.status)) actions.push({ action: "完成合同确认 / Complete Contract", why: "合同尚未确认，生产执行依据不完整。", owner, timing: "开始生产前" });
  const currentMilestone = order.productionMilestones?.find((item) => item.status === "Current") ?? order.productionMilestones?.find((item) => item.status === "Pending");
  if (currentMilestone) actions.push({ action: `推进 ${currentMilestone.label}`, why: `这是当前生产执行节点，依赖：${currentMilestone.dependency ?? "无"}。`, owner: currentMilestone.owner, timing: currentMilestone.targetDate });
  const approval = order.approvals?.find((item) => item.blocking && item.status !== "Approved" && item.status !== "Not Required");
  if (order.production?.status === "Completed" && approval) actions.push({ action: `完成 ${approval.type}`, why: "阻塞审批未完成，不能进入 Ready to Ship。", owner: approval.owner, timing: "安排出货前" });
  if (getShipmentReadiness(context).status === "Ready to Ship" && (!context.shipment || context.shipment.status === "Pending")) actions.push({ action: "安排出货 / Arrange Shipment", why: "生产、审批、包装与文件已满足出货条件。", owner: "Order Operations", timing: "立即" });
  if (context.shipment?.status === "Delivered" && getPaymentRisk(order).level !== "Normal") actions.push({ action: "跟进回款 / Follow Payment", why: "货物已送达，但回款尚未完成。", owner, timing: order.expectedPaymentDate ?? "待确认" });
  return actions.slice(0, 3);
}

export function canCompleteOrder(context: OrderContext) {
  const delivered = context.shipment?.status === "Delivered";
  const paid = getPaymentRisk(context.order).level === "Normal";
  const blocking = context.order.issues?.some((item) => item.blocking && !item.resolved);
  return delivered && paid && !blocking;
}

export function getLifecycle(context: OrderContext) {
  const order = context.order;
  const orderIndex = lifecycleOrder.indexOf(order.currentStage);
  return lifecycleOrder.map((stage, index) => {
    const blocked = index === orderIndex && getOrderHealth(context).status === "Blocked";
    return { stage, status: blocked ? "Blocked" : index < orderIndex || order.currentStage === "Completed" ? "Completed" : index === orderIndex ? "Current" : "Pending", owner: lifecycleOwner(stage, context), targetDate: lifecycleDate(stage, context), actualDate: lifecycleActual(stage, context), dependency: lifecycleDependency(stage) } as const;
  });
}

const lifecycleOrder: OrderStage[] = ["PO Received", "Contract", "Production", "Approval", "Delivery", "Shipment", "Payment", "Completed"];
function lifecycleOwner(stage: OrderStage, context: OrderContext) { return ["Production", "Approval"].includes(stage) ? "Order Operations" : stage === "Shipment" || stage === "Delivery" ? "Logistics" : context.order.owner; }
function lifecycleDate(stage: OrderStage, context: OrderContext) { if (stage === "PO Received") return context.order.poDate; if (stage === "Contract") return context.contract?.createdDate ?? "待确认"; if (stage === "Production") return context.order.production?.targetCompletion ?? "待确认"; if (stage === "Approval") return context.order.production?.targetCompletion ?? "待确认"; if (stage === "Delivery") return context.delivery?.plannedDate ?? context.order.deliveryDate; if (stage === "Shipment") return context.shipment?.etd ?? "待确认"; if (stage === "Payment") return context.order.expectedPaymentDate ?? "待确认"; return "待完成"; }
function lifecycleActual(stage: OrderStage, context: OrderContext) { if (stage === "PO Received") return context.order.poDate; if (stage === "Contract") return context.contract?.confirmedAt; if (stage === "Production" && context.order.production?.status === "Completed") return context.order.production.targetCompletion; if (stage === "Delivery") return context.delivery?.actualDate; if (stage === "Shipment") return context.shipment?.departedDate; if (stage === "Payment" && getPaymentRisk(context.order).level === "Normal") return DEMO_DATE; return undefined; }
function lifecycleDependency(stage: OrderStage) { const dependencies: Record<OrderStage, string> = { "PO Received": "Accepted Quote", Contract: "PO Received", Production: "Contract Confirmed", Approval: "Bulk Production", Delivery: "Approval + Packing", Shipment: "Ready to Ship", Payment: "Payment Term", Completed: "Delivered + Paid" }; return dependencies[stage]; }

export function getOrderMetrics(workspace: OrderWorkspace, quotationWorkspace: QuotationWorkspace, allProjects: Project[] = projects) {
  const contexts = workspace.orders.map((item) => getOrderContext(item, workspace, quotationWorkspace, allProjects));
  return {
    active: contexts.filter((item) => item.order.currentStage !== "Completed").length,
    atRisk: contexts.filter((item) => ["At Risk", "Blocked"].includes(getOrderHealth(item).status)).length,
    shippingSoon: contexts.filter((item) => item.order.currentStage !== "Completed" && daysUntil(item.order.deliveryDate) >= 0 && daysUntil(item.order.deliveryDate) <= 30).length,
    completed: contexts.filter((item) => item.order.currentStage === "Completed").length,
  };
}

export function matchesOrderFilter(context: OrderContext, filter: OrderFilter) {
  if (filter === "All") return true;
  if (filter === "Active") return context.order.currentStage !== "Completed";
  if (filter === "At Risk") return ["At Risk", "Blocked"].includes(getOrderHealth(context).status);
  if (filter === "Shipping Soon") return daysUntil(context.order.deliveryDate) >= 0 && daysUntil(context.order.deliveryDate) <= 30;
  return context.order.currentStage === "Completed";
}

export function createOrderFromQuote(quote: Quotation, workspace: OrderWorkspace, allProjects: Project[] = projects) {
  const existing = workspace.orders.find((item) => item.quotationId === quote.id);
  if (existing) return { existing } as const;
  if (quote.status !== "Accepted") return { blocked: "Only an Accepted quotation can create a Purchase Order." } as const;
  const project = allProjects.find((item) => item.id === quote.projectId);
  const client = clients.find((item) => item.id === quote.clientId);
  const id = `po-${quote.id.toLowerCase()}`;
  const poNumber = `PO-${project?.code ?? quote.projectId}-${quote.version}-DEMO`;
  const deliveryDate = /^\d{4}-\d{2}-\d{2}$/.test(project?.delivery ?? "") ? project!.delivery : "";
  const amount = quote.lineItems?.reduce((sum, item) => sum + item.amount, 0) ?? quote.quantity * quote.unitPrice;
  const order: PurchaseOrder = {
    id, poNumber, clientId: quote.clientId, projectId: quote.projectId, quotationId: quote.id, amount, currency: quote.currency,
    poDate: DEMO_DATE, deliveryDate, currentStage: "PO Received", health: "良好", owner: quote.owner ?? project?.owner ?? "待分配", paymentStatus: "Not Due",
    paymentTerm: quote.paymentTerm, incoterm: quote.incoterm, shipTo: client ? `${client.region} · ${client.country} · Demo Destination` : "待确认", paidAmount: 0,
    production: { factory: "待分配 / Not assigned", targetCompletion: deliveryDate || "待确认", progress: 0, quantity: quote.quantity, completedQuantity: 0, status: "Not Started" },
    productionMilestones: [], approvals: [], documents: [{ id: `doc-${id}-contract`, name: "Contract", status: "Pending" }, { id: `doc-${id}-ci`, name: "Commercial Invoice", status: "Pending" }, { id: `doc-${id}-pl`, name: "Packing List", status: "Pending" }, { id: `doc-${id}-test`, name: "Test Report", status: "Pending" }], issues: [],
    executionTimeline: [{ id: `oe-${id}-created`, category: "Commercial", date: DEMO_DATE, title: "Session Draft PO Created", detail: `Created from accepted ${quote.id}.` }],
  };
  const lines: OrderLine[] = quote.lineItems?.map((item, index) => ({ id: `${id}-line-${index + 1}`, purchaseOrderId: id, product: item.product, specification: item.specification, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice, amount: item.amount })) ?? [{ id: `${id}-line-1`, purchaseOrderId: id, product: quote.product, specification: quote.materialFinish ?? "按确认样 / As approved sample", quantity: quote.quantity, unit: quote.unit, unitPrice: quote.unitPrice, amount }];
  const contract: Contract = { id: `ct-${id}`, purchaseOrderId: id, projectId: quote.projectId, contractNumber: `CT-${poNumber}`, status: "Draft", createdDate: DEMO_DATE, paymentTerm: quote.paymentTerm, incoterm: quote.incoterm, contractValue: amount, owner: order.owner };
  const delivery: Delivery = { id: `dl-${id}`, purchaseOrderId: id, projectId: quote.projectId, plannedDate: deliveryDate, quantity: quote.quantity, destination: order.shipTo, method: "待确认 / Not confirmed", status: "Planned" };
  const shipment: Shipment = { id: `sh-${id}`, purchaseOrderId: id, projectId: quote.projectId, method: "待确认 / Not confirmed", destination: order.shipTo ?? "待确认", status: "Pending" };
  return { order, lines, contract, delivery, shipment } as const;
}

export function daysUntil(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return Number.POSITIVE_INFINITY;
  return Math.ceil((new Date(`${value}T00:00:00Z`).getTime() - new Date(`${DEMO_DATE}T00:00:00Z`).getTime()) / 86_400_000);
}

export function formatOrderValue(value: number, currency: PurchaseOrder["currency"]) {
  return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
