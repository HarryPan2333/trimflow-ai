import {
  clients,
  negotiationRecords,
  projects,
  purchaseOrders,
  quotationTiers,
  quotations,
} from "../../lib/mock-data";
import type {
  Client,
  NegotiationRecord,
  Project,
  PurchaseOrder,
  Quotation,
  QuotationStatus,
  QuotationTier,
} from "../../lib/mock-data";
import { DEMO_DATE, getSampleReadiness, getSpecificationRows, type SampleContext } from "../samples/sample-data";

export type QuotationWorkspace = {
  quotations: Quotation[];
  tiers: QuotationTier[];
  records: NegotiationRecord[];
};

export type QuotationContext = {
  quotation: Quotation;
  client?: Client;
  project?: Project;
  tiers: QuotationTier[];
  records: NegotiationRecord[];
  purchaseOrder?: PurchaseOrder;
  versions: Quotation[];
};

export type QuotationFilter = "All" | "Draft" | "Sent" | "Negotiating" | "Accepted" | "Expired";

export type QuotationAction =
  | { type: "update"; id: string; changes: Partial<Quotation>; record?: NegotiationRecord }
  | { type: "create"; quotation: Quotation; tiers: QuotationTier[]; record?: NegotiationRecord };

export function createQuotationWorkspace(): QuotationWorkspace {
  return {
    quotations: structuredClone(quotations),
    tiers: structuredClone(quotationTiers),
    records: structuredClone(negotiationRecords),
  };
}

export function quotationWorkspaceReducer(state: QuotationWorkspace, action: QuotationAction): QuotationWorkspace {
  if (action.type === "update") {
    return {
      ...state,
      quotations: state.quotations.map((item) => item.id === action.id ? { ...item, ...action.changes } : item),
      records: action.record ? [...state.records, action.record] : state.records,
    };
  }
  if (state.quotations.some((item) => item.id === action.quotation.id)) return state;
  return {
    quotations: [...state.quotations, action.quotation],
    tiers: [...state.tiers, ...action.tiers],
    records: action.record ? [...state.records, action.record] : state.records,
  };
}

export function effectiveStatus(quote: Quotation): QuotationStatus {
  if (["Accepted", "Rejected"].includes(quote.status)) return quote.status;
  return quote.validUntil && quote.validUntil < DEMO_DATE ? "Expired" : quote.status;
}

export function getQuotationContext(quotation: Quotation, workspace: QuotationWorkspace, allProjects: Project[] = projects): QuotationContext {
  const versions = workspace.quotations
    .filter((item) => item.projectId === quotation.projectId && item.product === quotation.product)
    .sort((a, b) => versionNumber(a.version) - versionNumber(b.version));
  return {
    quotation,
    client: clients.find((item) => item.id === quotation.clientId),
    project: allProjects.find((item) => item.id === quotation.projectId),
    tiers: workspace.tiers.filter((item) => item.quotationId === quotation.id).sort((a, b) => a.minimumQuantity - b.minimumQuantity),
    records: workspace.records.filter((item) => item.quotationId === quotation.id || item.projectId === quotation.projectId).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    purchaseOrder: purchaseOrders.find((item) => item.quotationId === quotation.id),
    versions,
  };
}

export function getQuotationMetrics(workspace: QuotationWorkspace) {
  const status = workspace.quotations.map((item) => effectiveStatus(item));
  const expiring = workspace.quotations.filter((item) => {
    if (!["Sent", "Negotiating"].includes(effectiveStatus(item))) return false;
    const days = daysUntil(item.validUntil);
    return days >= 0 && days <= 14;
  }).length;
  return {
    active: status.filter((item) => ["Draft", "Internal Review", "Sent", "Negotiating"].includes(item)).length,
    negotiating: status.filter((item) => item === "Negotiating").length,
    expiring,
    accepted: status.filter((item) => item === "Accepted").length,
  };
}

export function daysUntil(value: string) {
  return Math.ceil((new Date(`${value}T00:00:00Z`).getTime() - new Date(`${DEMO_DATE}T00:00:00Z`).getTime()) / 86_400_000);
}

export function formatMoney(value: number, currency: Quotation["currency"], digits = 2) {
  if (!value) return "待填写 / Pending";
  return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function priceGap(quote: Quotation) {
  if (!quote.unitPrice || !quote.targetPrice) return undefined;
  return ((quote.unitPrice - quote.targetPrice) / quote.targetPrice) * 100;
}

export function getNegotiationHealth(quote: Quotation) {
  const status = effectiveStatus(quote);
  if (status === "Accepted") return { level: "normal", label: "已接受 / Accepted", note: "商务条件已确认，不再显示到期风险。" } as const;
  if (status === "Expired") return { level: "high", label: "已过期 / Expired", note: "报价有效期已结束，需要确认是否创建新版本。" } as const;
  const days = daysUntil(quote.validUntil);
  if (days <= 7) return { level: "high", label: "高关注 / High", note: `有效期剩余 ${Math.max(0, days)} 天。` } as const;
  if (days <= 14) return { level: "medium", label: "需跟进 / Watch", note: `有效期剩余 ${days} 天。` } as const;
  return { level: "normal", label: "正常 / On Track", note: `有效期剩余 ${days} 天。` } as const;
}

export function getGapRows(quote: Quotation) {
  const gap = priceGap(quote);
  return [
    { label: "价格 / Price", ours: formatMoney(quote.unitPrice, quote.currency), customer: quote.targetPrice ? formatMoney(quote.targetPrice, quote.currency) : "尚未确认", status: gap === undefined ? "Pending" : Math.abs(gap) <= 5 ? "Close" : "Gap", note: gap === undefined ? "待客户确认目标价格" : `${gap > 0 ? "+" : ""}${gap.toFixed(1)}%` },
    { label: "起订量 / MOQ", ours: quote.moq ? quote.moq.toLocaleString("en-US") : "待填写", customer: quote.customerTargetMoq ? quote.customerTargetMoq.toLocaleString("en-US") : "尚未确认", status: quote.customerTargetMoq ? (quote.moq <= quote.customerTargetMoq ? "Aligned" : "Gap") : "Pending", note: "以书面数量承诺为准" },
    { label: "交期 / Lead Time", ours: quote.leadTime ?? "待填写", customer: quote.customerTargetLeadTime ?? "尚未确认", status: compareText(quote.leadTime, quote.customerTargetLeadTime), note: "从确认订单及资料齐备后计算" },
    { label: "付款 / Payment", ours: quote.paymentTerm ?? "待填写", customer: quote.customerPaymentTerm ?? "尚未确认", status: compareText(quote.paymentTerm, quote.customerPaymentTerm), note: "不推断未记录的账期" },
    { label: "测试 / Testing", ours: quote.testingRequirement ?? "待填写", customer: quote.customerTestingRequirement ?? "尚未确认", status: compareText(quote.testingRequirement, quote.customerTestingRequirement), note: "费用包含范围需写入报价" },
    { label: "材料与表面 / Material & Finish", ours: quote.materialFinish ?? "待填写", customer: quote.customerMaterialFinish ?? "尚未确认", status: compareText(quote.materialFinish, quote.customerMaterialFinish), note: "以确认样与规格为准" },
  ];
}

function compareText(ours?: string, customer?: string) {
  if (!customer) return "Pending";
  return ours?.trim().toLowerCase() === customer.trim().toLowerCase() ? "Aligned" : "Review";
}

export function getCommercialLevers(quote: Quotation) {
  return [
    { lever: "数量承诺 / Volume commitment", current: quote.quantity ? `${quote.quantity.toLocaleString("en-US")} ${quote.unit}` : "待确认", possible: "使用已记录的价格阶梯", impact: "数量提高可支持更积极档位" },
    { lever: "包装 / Packaging", current: "标准包装 / Standard", possible: "保持统一规格与包装", impact: "减少复杂度，不承诺额外折让" },
    { lever: "专项测试 / Special testing", current: quote.testingRequirement ?? "待确认", possible: quote.additionalFee ? `${quote.currency} ${quote.additionalFee} 单列` : "按报价包含范围执行", impact: "明确费用边界" },
    { lever: "付款 / Payment", current: quote.paymentTerm ?? "待确认", possible: "保持已记录付款条件", impact: "以条件交换而非单向降价" },
  ];
}

export function getStrategy(quote: Quotation, tiers: QuotationTier[]) {
  const recommended = tiers.find((item) => item.recommended) ?? tiers.at(0);
  return {
    objective: quote.status === "Accepted" ? "完成报价到订单的资料交接。" : "在不改变已确认技术要求的前提下，缩小商务差距。",
    protect: ["已确认材料与测试要求", "模具、专项测试及其他明确费用", "报价有效期与付款条件"],
    trade: ["有书面承诺的数量档位", "标准化包装", "可执行的采购节奏"],
    ask: ["确认年度数量及首批数量", "确认测试费用接受方式", "确认决策时间与有效期"],
    package: recommended ? `${recommended.minimumQuantity.toLocaleString("en-US")} ${quote.unit} · ${formatMoney(recommended.unitPrice, recommended.currency)} · ${recommended.leadTime ?? quote.leadTime ?? "交期待确认"}` : "当前项目材料中尚未确认可推荐的价格档位。",
  };
}

export function getReadiness(quote: Quotation) {
  const criteria = [
    { label: "确认样 / Approved Sample", ready: Boolean(quote.approvedSampleId), blocking: true },
    { label: "数量与币种 / Quantity & Currency", ready: Boolean(quote.quantity && quote.currency), blocking: false },
    { label: "价格与 MOQ / Price & MOQ", ready: Boolean(quote.unitPrice && quote.moq), blocking: false },
    { label: "交期与付款 / Lead Time & Payment", ready: Boolean(quote.leadTime && quote.paymentTerm), blocking: false },
    { label: "测试要求 / Testing", ready: Boolean(quote.testingRequirement), blocking: true },
    { label: "有效期 / Validity", ready: Boolean(quote.validUntil), blocking: false },
  ];
  const missing = criteria.filter((item) => !item.ready);
  const status = missing.some((item) => item.blocking) ? "Blocked" : missing.length ? "Needs Review" : "Ready to Send";
  return { criteria, missing, status } as const;
}

export function getQuotationRisks(context: QuotationContext) {
  const quote = context.quotation;
  const risks: Array<{ level: "High" | "Medium" | "Low"; title: string; detail: string }> = [];
  const health = getNegotiationHealth(quote);
  if (health.level === "high") risks.push({ level: "High", title: "报价有效期", detail: health.note });
  else if (health.level === "medium") risks.push({ level: "Medium", title: "报价有效期", detail: health.note });
  const gap = priceGap(quote);
  if (gap !== undefined && gap > 5) risks.push({ level: gap > 10 ? "High" : "Medium", title: "价格差距", detail: `当前报价高于客户目标 ${gap.toFixed(1)}%；需用现有数量档位与条件交换推进。` });
  if (!quote.targetPrice && effectiveStatus(quote) !== "Accepted") risks.push({ level: "Medium", title: "客户目标", detail: "当前项目材料中尚未确认客户目标价格。" });
  if (getReadiness(quote).status !== "Ready to Send") risks.push({ level: "Low", title: "报价完整度", detail: "部分报价资料待补充；请以 Readiness 清单为准。" });
  return risks.slice(0, 3);
}

export function getNextActions(context: QuotationContext) {
  const quote = context.quotation;
  if (effectiveStatus(quote) === "Accepted") return context.purchaseOrder
    ? [{ action: "核对 PO 与已接受报价", owner: quote.owner ?? context.project?.owner ?? "待分配", timing: "本次订单交接" }]
    : [{ action: "创建 Purchase Order", owner: quote.owner ?? context.project?.owner ?? "待分配", timing: "客户正式 PO 到达后" }];
  const actions: Array<{ action: string; owner: string; timing: string }> = [];
  if (!quote.targetPrice) actions.push({ action: "确认客户目标价格与数量", owner: quote.owner ?? "销售", timing: "下次客户沟通" });
  if ((priceGap(quote) ?? 0) > 5) actions.push({ action: "用现有价格阶梯确认数量承诺", owner: quote.owner ?? "销售", timing: "有效期内" });
  if (daysUntil(quote.validUntil) <= 14) actions.push({ action: "确认客户决策时间与报价有效期", owner: quote.owner ?? "销售", timing: `${Math.max(0, daysUntil(quote.validUntil))} 天内` });
  if (!actions.length) actions.push({ action: quote.nextAction ?? "跟进客户商务反馈", owner: quote.owner ?? "销售", timing: "下一次客户联系" });
  return actions.slice(0, 3);
}

export function getVersionChanges(current: Quotation, previous?: Quotation) {
  if (!previous) return [];
  const rows = [
    ["单价 / Unit Price", formatMoney(previous.unitPrice, previous.currency), formatMoney(current.unitPrice, current.currency)],
    ["数量 / Quantity", previous.quantity.toLocaleString("en-US"), current.quantity.toLocaleString("en-US")],
    ["MOQ", previous.moq.toLocaleString("en-US"), current.moq.toLocaleString("en-US")],
    ["交期 / Lead Time", previous.leadTime ?? "尚未确认", current.leadTime ?? "尚未确认"],
    ["有效期 / Valid Until", previous.validUntil, current.validUntil],
    ["付款 / Payment", previous.paymentTerm ?? "尚未确认", current.paymentTerm ?? "尚未确认"],
  ];
  return rows.filter(([, before, after]) => before !== after).map(([label, before, after]) => ({ label, before, after }));
}

export function createDraftFromSample(context: SampleContext, workspace: QuotationWorkspace) {
  const existing = workspace.quotations
    .filter((item) => item.projectId === context.sample.projectId && item.product === context.sample.product)
    .sort((a, b) => versionNumber(b.version) - versionNumber(a.version))[0];
  if (existing) return { existing } as const;
  const code = context.project?.code ?? `P${context.sample.projectId}`;
  const suffix = context.sample.id.split("-").at(-1) ?? "SAMPLE";
  const id = `QT-${code}-${suffix}-V1`;
  const specs = getSpecificationRows(context);
  const find = (key: string) => specs.find((item) => item.key === key)?.value;
  const quantity = Number((context.project?.quantity ?? "").replace(/[^0-9]/g, "")) || 0;
  const moq = Number((find("moq") ?? "").replace(/[^0-9]/g, "")) || 0;
  const currency = context.client?.currency ?? "USD";
  const approved = getSampleReadiness(context).ready;
  const quotation: Quotation = {
    id, clientId: context.sample.clientId, projectId: context.sample.projectId, version: "V1", product: context.sample.product,
    quantity, unit: "pcs", unitPrice: 0, currency, status: "Draft", validUntil: "", issuedAt: DEMO_DATE,
    moq, incoterm: "待确认 / Not confirmed", clientFeedback: "尚未收到正式报价反馈。", approvedSampleId: approved ? context.sample.id : undefined,
    createdAt: DEMO_DATE, owner: context.sample.owner ?? context.project?.owner, paymentTerm: context.client?.paymentTerm,
    testingRequirement: find("testing"), materialFinish: [find("material"), find("finish")].filter(Boolean).join(" · "),
    nextAction: "补充价格、有效期与商务条件后完成内部复核", commercialPosition: "Balanced", additionalFee: 0,
    lineItems: [{ id: `${id}-LINE-01`, quotationId: id, product: context.sample.product, specification: specs.filter((item) => ["material", "size", "color", "finish", "testing"].includes(item.key) && item.value).map((item) => item.value).join(" · "), quantity, unit: "pcs", unitPrice: 0, amount: 0, currency }],
  };
  return { quotation, tiers: [] as QuotationTier[] } as const;
}

export function createRevision(context: QuotationContext, values: { unitPrice: number; moq: number; leadTime: string; validUntil: string; reason: string }) {
  const latest = Math.max(...context.versions.map((item) => versionNumber(item.version)), 0) + 1;
  const version = `V${latest}`;
  const id = context.quotation.id.replace(/-V\d+$/, `-${version}`);
  const quotation: Quotation = {
    ...context.quotation,
    id,
    version,
    status: "Draft",
    unitPrice: values.unitPrice,
    moq: values.moq,
    leadTime: values.leadTime,
    validUntil: values.validUntil,
    createdAt: DEMO_DATE,
    issuedAt: DEMO_DATE,
    lastActivityAt: DEMO_DATE,
    reasonForRevision: values.reason,
    nextAction: "完成内部复核并发送客户",
    lineItems: context.quotation.lineItems?.map((item, index) => ({ ...item, id: `${id}-LINE-${String(index + 1).padStart(2, "0")}`, quotationId: id, unitPrice: values.unitPrice, amount: Number((item.quantity * values.unitPrice).toFixed(2)) })),
  };
  const delta = values.unitPrice - context.quotation.unitPrice;
  const tiers = context.tiers.map((item, index) => ({ ...item, id: `${id}-TIER-${index + 1}`, quotationId: id, unitPrice: Number((item.unitPrice + delta).toFixed(2)), leadTime: values.leadTime, moq: values.moq }));
  const record: NegotiationRecord = {
    id: `NEG-${id}`, quotationId: id, projectId: quotation.projectId, recordedAt: DEMO_DATE, direction: "内部建议",
    summary: `创建 ${version} 报价版本。`, nextAction: "完成内部复核并发送客户", actor: `${quotation.owner ?? "销售"} · Internal`,
    type: "Revision", ourPosition: `${formatMoney(values.unitPrice, quotation.currency)} · MOQ ${values.moq.toLocaleString("en-US")}`, customerPosition: quotation.targetPrice ? formatMoney(quotation.targetPrice, quotation.currency) : "尚未确认", note: values.reason, nextMove: "内部复核",
  };
  return { quotation, tiers, record };
}

export function statusMatches(quote: Quotation, filter: QuotationFilter) {
  const status = effectiveStatus(quote);
  if (filter === "All") return true;
  if (filter === "Draft") return ["Draft", "Internal Review"].includes(status);
  return status === filter;
}

function versionNumber(version: string) {
  return Number(version.replace(/\D/g, "")) || 0;
}
