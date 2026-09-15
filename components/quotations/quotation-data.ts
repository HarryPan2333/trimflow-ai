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
import type { Language } from "../../lib/i18n";

const localize = (language: Language, zh: string, en: string) => language === "zh" ? zh : en;

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

export function formatMoney(value: number, currency: Quotation["currency"], digits = 2, language: Language = "zh") {
  if (!value) return localize(language, "待填写", "Pending");
  return `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function priceGap(quote: Quotation) {
  if (!quote.unitPrice || !quote.targetPrice) return undefined;
  return ((quote.unitPrice - quote.targetPrice) / quote.targetPrice) * 100;
}

export function getNegotiationHealth(quote: Quotation, language: Language = "zh") {
  const status = effectiveStatus(quote);
  if (status === "Accepted") return { level: "normal", label: localize(language, "已接受", "Accepted"), note: localize(language, "商务条件已确认，不再显示到期风险。", "Commercial terms are confirmed, so expiry risk no longer applies.") } as const;
  if (status === "Expired") return { level: "high", label: localize(language, "已过期", "Expired"), note: localize(language, "报价有效期已结束，需要确认是否创建新版本。", "The quotation has expired. Confirm whether a new revision is required.") } as const;
  const days = daysUntil(quote.validUntil);
  if (days <= 7) return { level: "high", label: localize(language, "高关注", "High"), note: localize(language, `有效期剩余 ${Math.max(0, days)} 天。`, `${Math.max(0, days)} days remain before expiry.`) } as const;
  if (days <= 14) return { level: "medium", label: localize(language, "需跟进", "Watch"), note: localize(language, `有效期剩余 ${days} 天。`, `${days} days remain before expiry.`) } as const;
  return { level: "normal", label: localize(language, "正常", "On Track"), note: localize(language, `有效期剩余 ${days} 天。`, `${days} days remain before expiry.`) } as const;
}

export function getGapRows(quote: Quotation, language: Language = "zh") {
  const gap = priceGap(quote);
  const pending = localize(language, "尚未确认", "Not confirmed");
  const empty = localize(language, "待填写", "Pending");
  return [
    { label: localize(language, "价格", "Price"), ours: formatMoney(quote.unitPrice, quote.currency, 2, language), customer: quote.targetPrice ? formatMoney(quote.targetPrice, quote.currency, 2, language) : pending, status: gap === undefined ? "Pending" : Math.abs(gap) <= 5 ? "Close" : "Gap", note: gap === undefined ? localize(language, "待客户确认目标价格", "Awaiting confirmation of the client's target price") : `${gap > 0 ? "+" : ""}${gap.toFixed(1)}%` },
    { label: "MOQ", ours: quote.moq ? quote.moq.toLocaleString("en-US") : empty, customer: quote.customerTargetMoq ? quote.customerTargetMoq.toLocaleString("en-US") : pending, status: quote.customerTargetMoq ? (quote.moq <= quote.customerTargetMoq ? "Aligned" : "Gap") : "Pending", note: localize(language, "以书面数量承诺为准", "Use only written volume commitments") },
    { label: localize(language, "交期", "Lead Time"), ours: quote.leadTime ?? empty, customer: quote.customerTargetLeadTime ?? pending, status: compareText(quote.leadTime, quote.customerTargetLeadTime), note: localize(language, "从确认订单及资料齐备后计算", "Count from order confirmation and receipt of all required materials") },
    { label: localize(language, "付款", "Payment"), ours: quote.paymentTerm ?? empty, customer: quote.customerPaymentTerm ?? pending, status: compareText(quote.paymentTerm, quote.customerPaymentTerm), note: localize(language, "不推断未记录的账期", "Do not infer unrecorded payment terms") },
    { label: localize(language, "测试", "Testing"), ours: quote.testingRequirement ?? empty, customer: quote.customerTestingRequirement ?? pending, status: compareText(quote.testingRequirement, quote.customerTestingRequirement), note: localize(language, "费用包含范围需写入报价", "The quotation must state what testing costs are included") },
    { label: localize(language, "材料与表面", "Material & Finish"), ours: quote.materialFinish ?? empty, customer: quote.customerMaterialFinish ?? pending, status: compareText(quote.materialFinish, quote.customerMaterialFinish), note: localize(language, "以确认样与规格为准", "Use the approved sample and confirmed specification") },
  ];
}

function compareText(ours?: string, customer?: string) {
  if (!customer) return "Pending";
  return ours?.trim().toLowerCase() === customer.trim().toLowerCase() ? "Aligned" : "Review";
}

export function getCommercialLevers(quote: Quotation, language: Language = "zh") {
  const unit = language === "en" ? quote.unit === "条" ? "pcs" : quote.unit === "套" ? "sets" : quote.unit : quote.unit;
  return [
    { lever: localize(language, "数量承诺", "Volume Commitment"), current: quote.quantity ? `${quote.quantity.toLocaleString("en-US")} ${unit}` : localize(language, "待确认", "Not confirmed"), possible: localize(language, "使用已记录的价格阶梯", "Use documented price tiers"), impact: localize(language, "数量提高可支持更积极档位", "Higher committed volume may support a more competitive tier") },
    { lever: localize(language, "包装", "Packaging"), current: localize(language, "标准包装", "Standard packaging"), possible: localize(language, "保持统一规格与包装", "Keep specifications and packaging standardized"), impact: localize(language, "减少复杂度，不承诺额外折让", "Reduce complexity without promising an extra discount") },
    { lever: localize(language, "专项测试", "Special Testing"), current: quote.testingRequirement ?? localize(language, "待确认", "Not confirmed"), possible: quote.additionalFee ? `${quote.currency} ${quote.additionalFee} ${localize(language, "单列", "listed separately")}` : localize(language, "按报价包含范围执行", "Follow the scope included in the quotation"), impact: localize(language, "明确费用边界", "Clarify the cost boundary") },
    { lever: localize(language, "付款", "Payment"), current: quote.paymentTerm ?? localize(language, "待确认", "Not confirmed"), possible: localize(language, "保持已记录付款条件", "Maintain the recorded payment terms"), impact: localize(language, "以条件交换而非单向降价", "Trade conditions rather than making a one-way price concession") },
  ];
}

export function getStrategy(quote: Quotation, tiers: QuotationTier[], language: Language = "zh") {
  const recommended = tiers.find((item) => item.recommended) ?? tiers.at(0);
  const unit = language === "en" ? quote.unit === "条" ? "pcs" : quote.unit === "套" ? "sets" : quote.unit : quote.unit;
  return {
    objective: quote.status === "Accepted" ? localize(language, "完成报价到订单的资料交接。", "Complete the handoff from quotation to order.") : localize(language, "在不改变已确认技术要求的前提下，缩小商务差距。", "Narrow the commercial gap without changing confirmed technical requirements."),
    protect: language === "zh" ? ["已确认材料与测试要求", "模具、专项测试及其他明确费用", "报价有效期与付款条件"] : ["Confirmed material and testing requirements", "Tooling, special testing, and other explicit fees", "Quotation validity and payment terms"],
    trade: language === "zh" ? ["有书面承诺的数量档位", "标准化包装", "可执行的采购节奏"] : ["Volume tiers backed by written commitments", "Standardized packaging", "An executable purchasing cadence"],
    ask: language === "zh" ? ["确认年度数量及首批数量", "确认测试费用接受方式", "确认决策时间与有效期"] : ["Confirm annual and first-order volume", "Confirm how testing fees will be accepted", "Confirm decision timing and quotation validity"],
    package: recommended ? `${recommended.minimumQuantity.toLocaleString("en-US")} ${unit} · ${formatMoney(recommended.unitPrice, recommended.currency, 2, language)} · ${recommended.leadTime ?? quote.leadTime ?? localize(language, "交期待确认", "Lead time pending")}` : localize(language, "当前项目材料中尚未确认可推荐的价格档位。", "No recommended price tier is confirmed in the current project materials."),
  };
}

export function getReadiness(quote: Quotation, language: Language = "zh") {
  const criteria = [
    { label: localize(language, "确认样", "Approved Sample"), ready: Boolean(quote.approvedSampleId), blocking: true },
    { label: localize(language, "数量与币种", "Quantity & Currency"), ready: Boolean(quote.quantity && quote.currency), blocking: false },
    { label: localize(language, "价格与 MOQ", "Price & MOQ"), ready: Boolean(quote.unitPrice && quote.moq), blocking: false },
    { label: localize(language, "交期与付款", "Lead Time & Payment"), ready: Boolean(quote.leadTime && quote.paymentTerm), blocking: false },
    { label: localize(language, "测试要求", "Testing Requirement"), ready: Boolean(quote.testingRequirement), blocking: true },
    { label: localize(language, "有效期", "Validity"), ready: Boolean(quote.validUntil), blocking: false },
  ];
  const missing = criteria.filter((item) => !item.ready);
  const status = missing.some((item) => item.blocking) ? "Blocked" : missing.length ? "Needs Review" : "Ready to Send";
  return { criteria, missing, status } as const;
}

export function getQuotationRisks(context: QuotationContext, language: Language = "zh") {
  const quote = context.quotation;
  const risks: Array<{ level: "High" | "Medium" | "Low"; title: string; detail: string }> = [];
  const health = getNegotiationHealth(quote, language);
  if (health.level === "high") risks.push({ level: "High", title: localize(language, "报价有效期", "Quotation Validity"), detail: health.note });
  else if (health.level === "medium") risks.push({ level: "Medium", title: localize(language, "报价有效期", "Quotation Validity"), detail: health.note });
  const gap = priceGap(quote);
  if (gap !== undefined && gap > 5) risks.push({ level: gap > 10 ? "High" : "Medium", title: localize(language, "价格差距", "Price Gap"), detail: localize(language, `当前报价高于客户目标 ${gap.toFixed(1)}%；需用现有数量档位与条件交换推进。`, `The current quote is ${gap.toFixed(1)}% above the client's target. Use documented volume tiers and conditional trade-offs to progress.`) });
  if (!quote.targetPrice && effectiveStatus(quote) !== "Accepted") risks.push({ level: "Medium", title: localize(language, "客户目标", "Client Target"), detail: localize(language, "当前项目材料中尚未确认客户目标价格。", "The client's target price is not confirmed in the current project materials.") });
  if (getReadiness(quote, language).status !== "Ready to Send") risks.push({ level: "Low", title: localize(language, "报价完整度", "Quotation Completeness"), detail: localize(language, "部分报价资料待补充；请以准备度清单为准。", "Some quotation details remain incomplete; use the readiness checklist as the source of truth.") });
  return risks.slice(0, 3);
}

export function getNextActions(context: QuotationContext, language: Language = "zh") {
  const quote = context.quotation;
  if (effectiveStatus(quote) === "Accepted") return context.purchaseOrder
    ? [{ action: localize(language, "核对 PO 与已接受报价", "Reconcile the PO with the accepted quotation"), owner: quote.owner ?? context.project?.owner ?? localize(language, "待分配", "Not assigned"), timing: localize(language, "本次订单交接", "During this order handoff") }]
    : [{ action: localize(language, "创建采购订单", "Create Purchase Order"), owner: quote.owner ?? context.project?.owner ?? localize(language, "待分配", "Not assigned"), timing: localize(language, "客户正式 PO 到达后", "After the client's formal PO arrives") }];
  const actions: Array<{ action: string; owner: string; timing: string }> = [];
  if (!quote.targetPrice) actions.push({ action: localize(language, "确认客户目标价格与数量", "Confirm the client's target price and volume"), owner: quote.owner ?? localize(language, "销售", "Sales"), timing: localize(language, "下次客户沟通", "At the next client conversation") });
  if ((priceGap(quote) ?? 0) > 5) actions.push({ action: localize(language, "用现有价格阶梯确认数量承诺", "Use existing price tiers to confirm the volume commitment"), owner: quote.owner ?? localize(language, "销售", "Sales"), timing: localize(language, "有效期内", "Within the validity period") });
  if (daysUntil(quote.validUntil) <= 14) actions.push({ action: localize(language, "确认客户决策时间与报价有效期", "Confirm the client's decision timing and quotation validity"), owner: quote.owner ?? localize(language, "销售", "Sales"), timing: localize(language, `${Math.max(0, daysUntil(quote.validUntil))} 天内`, `Within ${Math.max(0, daysUntil(quote.validUntil))} days`) });
  if (!actions.length) actions.push({ action: quote.nextAction ?? localize(language, "跟进客户商务反馈", "Follow up on the client's commercial feedback"), owner: quote.owner ?? localize(language, "销售", "Sales"), timing: localize(language, "下一次客户联系", "At the next client contact") });
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
