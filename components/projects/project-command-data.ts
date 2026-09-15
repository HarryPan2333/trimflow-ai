import type {
  Client,
  Communication,
  Contact,
  Contract,
  Delivery,
  LifecycleStage,
  NegotiationRecord,
  OrderLine,
  Project,
  PurchaseOrder,
  Quotation,
  QuotationTier,
  Requirement,
  Sample,
  SampleFeedback,
  SampleVersion,
  Shipment,
  Task,
  TimelineEvent,
} from "../../lib/mock-data";
import {
  clients,
  communications,
  contacts,
  contracts,
  deliveries,
  negotiationRecords,
  orderLines,
  projectRequirements,
  projects,
  purchaseOrders,
  quotationTiers,
  quotations,
  sampleFeedback,
  sampleVersions,
  samples,
  shipments,
  tasks,
  timelineEvents,
} from "../../lib/mock-data";
import type { LifecycleMilestone } from "../business/lifecycle-stepper";
import { localizeNarrative, type Language } from "../../lib/i18n";

export type ProjectCommandData = {
  project: Project;
  client?: Client;
  contacts: Contact[];
  requirements: Requirement[];
  samples: Sample[];
  sampleVersions: SampleVersion[];
  sampleFeedback: SampleFeedback[];
  quotations: Quotation[];
  quotationTiers: QuotationTier[];
  negotiationRecords: NegotiationRecord[];
  purchaseOrders: PurchaseOrder[];
  orderLines: OrderLine[];
  contracts: Contract[];
  deliveries: Delivery[];
  shipments: Shipment[];
  communications: Communication[];
  tasks: Task[];
  timeline: TimelineEvent[];
};

export type OpportunityPriority = {
  level: "P1" | "P2" | "P3" | "P4";
  label: "Strategic" | "High Potential" | "Standard" | "Nurture";
  score: number;
  reason: string;
};

export type DealRisk = {
  id: string;
  type: "Commercial" | "Technical" | "Relationship" | "Timing" | "Process" | "Compliance";
  severity: "Critical" | "High" | "Medium" | "Low";
  reason: string;
  action: string;
};

export type NextBestAction = {
  id: string;
  action: string;
  why: string;
  owner: string;
  timing: string;
};

const DAY = 86_400_000;
const lifecycleOrder: LifecycleStage[] = ["inquiry", "requirement", "sample", "quotation", "negotiation", "po", "delivery", "shipment"];

function time(value?: string) {
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

const localized = (language: Language, zh: string, en: string) => language === "zh" ? zh : en;

function shortDate(value?: string, language: Language = "zh") {
  if (!value) return undefined;
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function getProjectCommandData(project: Project): ProjectCommandData {
  const quoteIds = new Set(quotations.filter((item) => item.projectId === project.id).map((item) => item.id));
  const poIds = new Set(purchaseOrders.filter((item) => item.projectId === project.id).map((item) => item.id));
  const sampleIds = new Set(samples.filter((item) => item.projectId === project.id).map((item) => item.id));
  return {
    project,
    client: clients.find((item) => item.id === project.clientId),
    contacts: contacts.filter((item) => item.clientId === project.clientId),
    requirements: projectRequirements.filter((item) => item.projectId === project.id),
    samples: samples.filter((item) => item.projectId === project.id),
    sampleVersions: sampleVersions.filter((item) => item.projectId === project.id || sampleIds.has(item.sampleId)),
    sampleFeedback: sampleFeedback.filter((item) => item.projectId === project.id),
    quotations: quotations.filter((item) => item.projectId === project.id),
    quotationTiers: quotationTiers.filter((item) => quoteIds.has(item.quotationId)),
    negotiationRecords: negotiationRecords.filter((item) => item.projectId === project.id),
    purchaseOrders: purchaseOrders.filter((item) => item.projectId === project.id),
    orderLines: orderLines.filter((item) => poIds.has(item.purchaseOrderId)),
    contracts: contracts.filter((item) => item.projectId === project.id),
    deliveries: deliveries.filter((item) => item.projectId === project.id),
    shipments: shipments.filter((item) => item.projectId === project.id),
    communications: communications.filter((item) => item.projectId === project.id),
    tasks: tasks.filter((item) => item.projectId === project.id),
    timeline: timelineEvents.filter((item) => item.projectId === project.id).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
  };
}

export function getReferenceTime() {
  return Math.max(
    ...projects.map((item) => time(item.lastUpdatedAt)),
    ...timelineEvents.map((item) => time(item.occurredAt)),
    ...communications.map((item) => time(item.occurredAt)),
  );
}

export function getOpportunityPriority(data: ProjectCommandData, language: Language = "zh"): OpportunityPriority {
  const stageIndex = lifecycleOrder.indexOf(data.project.lifecycleStage);
  const confirmedSample = data.samples.some((item) => item.status === "已确认");
  const activeQuote = data.quotations.some((item) => ["Sent", "Negotiating", "Accepted"].includes(item.status));
  let score = 0;
  if (data.client?.status === "活跃") score += 2;
  if (stageIndex >= 4) score += 2;
  else if (stageIndex >= 2) score += 1;
  if (confirmedSample) score += 2;
  else if (data.samples.length > 0) score += 1;
  if (activeQuote) score += 1;
  if (data.purchaseOrders.length > 0) score += 2;
  if (data.communications.length >= 3) score += 1;
  if (data.samples.length > 1 || data.project.product.includes("、")) score += 1;

  if (score >= 7) return { level: "P1", label: "Strategic", score, reason: localized(language, "项目成熟度、客户参与度与商业推进均处于高优先级区间。", "Project maturity, client engagement, and commercial momentum all indicate high priority.") };
  if (score >= 3) return { level: "P2", label: "High Potential", score, reason: localized(language, "已有明确开发投入，具备继续推进和扩品潜力。", "The account has meaningful development investment and potential for further progress and category expansion.") };
  if (score >= 2) return { level: "P3", label: "Standard", score, reason: localized(language, "机会信息已建立，按标准销售节奏推进。", "The opportunity is qualified and should follow the standard sales cadence.") };
  return { level: "P4", label: "Nurture", score, reason: localized(language, "当前商业信号有限，建议保持低成本培育。", "Commercial signals are limited; maintain a low-cost nurture cadence.") };
}

export function getStageSensitiveFollowUp(data: ProjectCommandData, language: Language = "zh") {
  const reference = getReferenceTime();
  const lastContact = time(data.client?.lastContactAt);
  const elapsedDays = lastContact ? Math.floor((reference - lastContact) / DAY) : undefined;
  const reviewing = data.samples.some((item) => item.status === "客户评估中");
  let threshold = 10;
  let cadence = localized(language, "7–14 天", "7–14 days");
  if (data.project.lifecycleStage === "negotiation") { threshold = 3; cadence = localized(language, "48–72 小时", "48–72 hours"); }
  else if (data.project.lifecycleStage === "sample" && reviewing) { threshold = 5; cadence = localized(language, "3–5 个工作日", "3–5 business days"); }
  else if (["po", "delivery", "shipment"].includes(data.project.lifecycleStage)) { threshold = 0; cadence = localized(language, "按订单里程碑", "By order milestone"); }

  if (["po", "delivery", "shipment"].includes(data.project.lifecycleStage)) {
    const pendingTask = data.tasks.filter((item) => item.status !== "已完成").sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    return { cadence, elapsedDays, attention: Boolean(pendingTask && time(pendingTask.dueDate) <= reference), reason: pendingTask ? localized(language, `下一里程碑任务：${pendingTask.title}（${pendingTask.dueDate}）`, `Next milestone task: ${pendingTask.title} (${pendingTask.dueDate})`) : localized(language, "当前项目材料中尚未确认下一里程碑任务", "The next milestone task is not confirmed in the current project materials.") };
  }
  return { cadence, elapsedDays, attention: elapsedDays !== undefined && elapsedDays >= threshold, reason: elapsedDays === undefined ? localized(language, "当前项目材料中尚未确认最近联系时间", "The latest contact date is not confirmed in the current project materials.") : localized(language, `距上次客户联系 ${elapsedDays} 天；当前阶段建议节奏为 ${cadence}`, `${elapsedDays} days since the last client contact; recommended cadence for this stage: ${cadence}.`) };
}

export function getQuotationExpiryPriority(validUntil: string) {
  const remainingDays = Math.ceil((time(validUntil) - getReferenceTime()) / DAY);
  if (remainingDays <= 7) return { level: "High" as const, remainingDays };
  if (remainingDays <= 14) return { level: "Medium" as const, remainingDays };
  return { level: "None" as const, remainingDays };
}

export function getLifecycleMilestones(data: ProjectCommandData, language: Language = "zh"): LifecycleMilestone[] {
  const ascending = [...data.timeline].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const sampleEvents = ascending.filter((item) => item.type === "sample");
  const definitions: Array<{ id: string; label: string; stage: LifecycleStage; date?: string }> = [
    { id: "inquiry", label: "Inquiry", stage: "inquiry", date: ascending.find((item) => item.type === "inquiry")?.occurredAt },
    { id: "registration", label: "Registration", stage: "requirement", date: ascending.find((item) => item.type === "requirement")?.occurredAt },
    { id: "initial-sample", label: "Initial Sample", stage: "sample", date: sampleEvents[0]?.occurredAt },
    { id: "sales-sample", label: "Sales Sample", stage: "sample", date: sampleEvents[1]?.occurredAt ?? (data.project.lifecycleStage === "sample" ? sampleEvents[0]?.occurredAt : undefined) },
    { id: "quotation", label: "Quotation", stage: "quotation", date: ascending.find((item) => item.type === "quotation")?.occurredAt },
    { id: "negotiation", label: "Negotiation", stage: "negotiation", date: ascending.find((item) => item.type === "negotiation")?.occurredAt },
    { id: "po", label: "PO", stage: "po", date: ascending.find((item) => item.type === "po")?.occurredAt },
    { id: "production", label: "Production", stage: "delivery", date: ascending.find((item) => ["contract", "delivery"].includes(item.type))?.occurredAt },
    { id: "shipment", label: "Shipment", stage: "shipment", date: ascending.find((item) => item.type === "shipment")?.occurredAt },
  ];
  const current = lifecycleOrder.indexOf(data.project.lifecycleStage);
  return definitions.map((item) => {
    const index = lifecycleOrder.indexOf(item.stage);
    let status: LifecycleMilestone["status"] = index < current ? "completed" : index === current ? "current" : "pending";
    if (item.stage === "sample" && data.project.lifecycleStage === "sample") status = item.id === "sales-sample" ? "current" : "completed";
    return { id: item.id, label: item.label, status, date: shortDate(item.date, language), owner: item.date ? data.project.owner : undefined };
  });
}

export function getStageSummary(data: ProjectCommandData, language: Language = "zh") {
  const latest = data.timeline[0];
  const openQuote = [...data.quotations].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0];
  if (data.project.lifecycleStage === "negotiation" && openQuote) return localized(language, `${data.samples.some((item) => item.status === "已确认") ? "销售样已确认" : "样品阶段已完成"}，当前进入 ${openQuote.version} 报价谈判；${openQuote.targetPrice ? "客户目标价格已有记录，仍需确认成交条件" : "客户目标价格尚待确认"}。`, `${data.samples.some((item) => item.status === "已确认") ? "The sales sample is approved" : "The sample stage is complete"}; ${openQuote.version} is now under negotiation. ${openQuote.targetPrice ? "The client's target price is recorded, while closing terms remain to be confirmed." : "The client's target price is still unconfirmed."}`);
  if (data.project.lifecycleStage === "po") return localized(language, "正式 PO 已收到，当前重点转向合同、生产排期与计划交付控制。", "The formal PO has been received; focus now shifts to the contract, production schedule, and planned delivery controls.");
  if (data.project.lifecycleStage === "sample") return localized(language, `${data.samples.length} 个样品任务正在并行推进；待确认规格仍会影响下一步正式报价。`, `${data.samples.length} sample workstreams are moving in parallel; open specifications still affect the formal quotation.`);
  return latest ? localized(language, `${latest.title}；${data.project.next}`, `${localizeNarrative(latest.title, language)}; ${localizeNarrative(data.project.next, language)}`) : localizeNarrative(data.project.currentSummary, language);
}

export function getDealStrategy(data: ProjectCommandData, language: Language = "zh") {
  const clientType = data.client?.type.includes("新兴") ? "Emerging Brand" : data.client?.status === "活跃" ? "Strategic Large Brand" : "Growth Brand";
  const thesis = [
    data.samples.length ? localized(language, "快速样品迭代与响应能力", "Fast sample iteration and responsive support") : localized(language, "需求澄清与方案组织能力", "Requirement clarification and solution planning"),
    data.requirements.some((item) => item.field.includes("测试") || item.value.match(/REACH|AATCC/i)) ? localized(language, "测试与合规口径的专业支持", "Professional testing and compliance support") : localized(language, "规格整合与开发协同", "Specification consolidation and development coordination"),
    data.project.health === "良好" ? localized(language, "稳定的交付与过程控制", "Reliable delivery and process control") : localized(language, "主动识别风险并推动关键条件收口", "Proactive risk identification and closure of critical conditions"),
  ];
  const criteria = [
    data.quotations.length ? "Price" : undefined,
    data.samples.length ? "Quality" : undefined,
    data.requirements.some((item) => item.field.includes("测试")) ? "Compliance" : undefined,
    "Lead Time",
    data.client?.preferences.some((item) => item.includes("环保") || item.includes("再生")) ? "Sustainability" : undefined,
    data.samples.length > 1 ? "Innovation" : "MOQ",
  ].filter(Boolean) as string[];
  const leadWith = data.project.lifecycleStage === "negotiation" ? localized(language, "测试稳定性、数量阶梯与条件交换", "Test stability, volume tiers, and conditional trade-offs") : data.project.lifecycleStage === "sample" ? localized(language, "分产品确认规格，并以快速迭代降低开发不确定性", "Confirm specifications by product and reduce development uncertainty through fast iteration") : localized(language, "交付节点透明度与合同执行可靠性", "Milestone transparency and reliable contract execution");
  const avoid = data.project.lifecycleStage === "negotiation" ? localized(language, "只围绕单价继续让步", "Making further concessions based only on unit price") : data.project.lifecycleStage === "sample" ? localized(language, "在关键规格缺失时同时推进全部样品", "Advancing every sample while critical specifications remain open") : localized(language, "承诺尚未确认的生产或出货日期", "Promising unconfirmed production or shipment dates");
  return { clientType, thesis, criteria, leadWith, avoid };
}

export function getStakeholderCoverage(data: ProjectCommandData, language: Language = "zh") {
  const has = (roles: Contact["decisionRole"][]) => data.contacts.some((item) => item.decisionRole && roles.includes(item.decisionRole));
  const checks = [
    { label: localized(language, "产品 / 技术影响人", "Product / Technical Influencer"), covered: has(["Technical Approver", "Influencer", "User"]), reason: localized(language, "需要有人确认样品、规格或测试结果", "A stakeholder must approve samples, specifications, or test results") },
    { label: localized(language, "采购 / 商务角色", "Procurement / Commercial Role"), covered: has(["Buyer"]), reason: localized(language, "需要有人确认价格、条款与采购流程", "A stakeholder must confirm pricing, terms, and the procurement process") },
    { label: localized(language, "最终决策人", "Final Decision Maker"), covered: has(["Decision Maker"]), reason: localized(language, "避免只依赖单一日常联系人", "Avoid relying on a single day-to-day contact") },
  ];
  if (data.client?.preferences.some((item) => item.includes("环保") || item.includes("再生"))) checks.push({ label: localized(language, "可持续发展联系人", "Sustainability Contact"), covered: data.contacts.some((item) => item.department === "Sustainability"), reason: localized(language, "环保材料要求需要专门角色确认", "Sustainable material requirements need a dedicated approver") });
  const missing = checks.filter((item) => !item.covered).length;
  const level: "High" | "Medium" | "Low" = missing >= 2 ? "High" : missing === 1 ? "Medium" : "Low";
  return { checks, level, summary: missing ? localized(language, `${missing} 个关键角色尚未覆盖`, `${missing} key roles are not covered`) : localized(language, "核心决策角色覆盖完整", "Core decision roles are fully covered") };
}

function pendingImpact(requirement: Requirement) {
  if (/价格|数量|测试|交期|Logo|克重/.test(requirement.field)) return "High" as const;
  if (/颜色|尺寸|材质/.test(requirement.field)) return "Medium" as const;
  return "Low" as const;
}

export function getConfirmedPending(data: ProjectCommandData) {
  return {
    confirmed: data.requirements.filter((item) => item.status === "已确认"),
    pending: data.requirements.filter((item) => item.status !== "已确认").map((item) => ({ ...item, impact: pendingImpact(item) })),
  };
}

export function getDealRisks(data: ProjectCommandData, language: Language = "zh"): DealRisk[] {
  const risks: DealRisk[] = [];
  const latestQuote = [...data.quotations].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0];
  if (latestQuote?.targetPrice && latestQuote.targetPrice < latestQuote.unitPrice) risks.push({ id: "commercial-gap", type: "Commercial", severity: latestQuote.targetPrice / latestQuote.unitPrice < .94 ? "High" : "Medium", reason: localized(language, `客户目标价与当前 ${latestQuote.version} 报价存在差距。`, `The client's target price is below the current ${latestQuote.version} quotation.`), action: localized(language, "先确认数量承诺和可交换条件，再讨论价格调整。", "Confirm volume commitment and tradable terms before discussing a price adjustment.") });
  if (data.requirements.some((item) => item.status !== "已确认" && item.field.includes("测试"))) risks.push({ id: "technical-standard", type: "Technical", severity: "High", reason: localized(language, "最终测试标准尚未确认，可能影响材料和成本。", "The final testing standard is unconfirmed and may affect material selection and cost."), action: localized(language, "在报价或下一轮样品前书面锁定测试口径。", "Lock the testing method in writing before the next quotation or sample round.") });
  const coverage = getStakeholderCoverage(data, language);
  if (coverage.level !== "Low") risks.push({ id: "relationship-coverage", type: "Relationship", severity: coverage.level, reason: coverage.summary, action: localized(language, "请现有联系人引荐缺失的采购或决策角色。", "Ask the current contact to introduce the missing procurement or decision role.") });
  const followUp = getStageSensitiveFollowUp(data, language);
  if (followUp.attention) risks.push({ id: "timing-follow-up", type: "Timing", severity: data.project.lifecycleStage === "negotiation" ? "High" : "Medium", reason: followUp.reason, action: localized(language, "按当前阶段节奏安排下一次客户触达。", "Schedule the next client touchpoint according to the current-stage cadence.") });
  if (latestQuote && ["Sent", "Negotiating"].includes(latestQuote.status)) {
    const expiry = getQuotationExpiryPriority(latestQuote.validUntil);
    if (expiry.level !== "None") risks.push({ id: "quotation-expiry", type: "Timing", severity: expiry.level, reason: localized(language, `当前报价将在 ${Math.max(0, expiry.remainingDays)} 天内到期。`, `The current quotation expires in ${Math.max(0, expiry.remainingDays)} days.`), action: localized(language, "在有效期结束前确认客户决策进度与下一轮商务动作。", "Confirm the client's decision status and next commercial action before expiry.") });
  }
  if (data.tasks.some((item) => item.status !== "已完成" && time(item.dueDate) < getReferenceTime())) risks.push({ id: "process-overdue", type: "Process", severity: "Medium", reason: localized(language, "项目存在已逾期的内部执行任务。", "The project has overdue internal execution tasks."), action: localized(language, "确认负责人和新的完成时间，并同步对客户承诺的影响。", "Confirm the owner and revised completion date, then communicate any impact on client commitments.") });
  if (data.client?.preferences.some((item) => item.includes("环保") || item.includes("再生")) && !data.contacts.some((item) => item.department === "Sustainability")) risks.push({ id: "compliance-owner", type: "Compliance", severity: "Low", reason: localized(language, "环保材料要求尚无专门联系人负责确认。", "No dedicated contact is assigned to approve sustainable-material requirements."), action: localized(language, "在规格冻结前确认可持续材料审核角色。", "Confirm the sustainable-material approver before specifications are frozen.") });
  return risks.slice(0, 4);
}

export function getNextBestActions(data: ProjectCommandData, language: Language = "zh"): NextBestAction[] {
  const actions: NextBestAction[] = [];
  const pending = getConfirmedPending(data).pending.filter((item) => item.impact === "High");
  const task = data.tasks.filter((item) => item.status !== "已完成").sort((a, b) => a.priority.localeCompare(b.priority) || a.dueDate.localeCompare(b.dueDate))[0];
  if (task) actions.push({ id: task.id, action: localizeNarrative(task.title, language), why: localized(language, "这是当前项目已分配的最高优先级执行任务。", "This is the highest-priority assigned execution task for the project."), owner: task.owner, timing: task.dueDate });
  if (pending[0]) actions.push({ id: `req-${pending[0].id}`, action: localized(language, `确认${pending[0].field}`, `Confirm ${localizeNarrative(pending[0].field, language)}`), why: localized(language, "该信息对成本、开发或成交路径有直接影响。", "This information directly affects cost, development, or the path to close."), owner: data.project.owner, timing: localized(language, "下一次客户联系", "Next client contact") });
  const coverage = getStakeholderCoverage(data, language);
  if (coverage.checks.some((item) => ["最终决策人", "Final Decision Maker"].includes(item.label) && !item.covered)) actions.push({ id: "identify-decision-maker", action: localized(language, "识别并建立最终决策人联系", "Identify and engage the final decision maker"), why: localized(language, "当前关键人覆盖不完整，单一联系人风险较高。", "Stakeholder coverage is incomplete, creating single-contact risk."), owner: data.project.owner, timing: localized(language, "本轮商务沟通", "This commercial conversation") });
  for (const action of data.project.nextActions) {
    if (actions.length >= 3) break;
    if (!actions.some((item) => item.action.includes(action) || action.includes(item.action))) actions.push({ id: `project-${actions.length}`, action: localizeNarrative(action, language), why: localized(language, "来自当前项目已记录的下一步计划。", "Based on the next-step plan recorded for this project."), owner: data.project.owner, timing: localized(language, "本阶段完成", "Complete in this stage") });
  }
  return actions.slice(0, 3);
}

export function getCommercialOpportunity(data: ProjectCommandData, language: Language = "zh") {
  const latestQuote = [...data.quotations].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0];
  const po = data.purchaseOrders[0];
  const estimatedValue = po ? `${po.currency} ${po.amount.toLocaleString("en-US")}` : latestQuote ? `${latestQuote.currency} ${(latestQuote.quantity * latestQuote.unitPrice).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : localized(language, "当前项目材料中尚未确认", "Not confirmed in the current project materials");
  const productCount = new Set(data.samples.map((item) => item.product)).size || data.project.product.split("、").length;
  const expansionPotential = data.purchaseOrders.length ? "Seasonal Repeat" : productCount > 1 ? "Multi-Product" : getOpportunityPriority(data).level === "P1" ? "Strategic Account" : "Single Project";
  const expansion = data.project.product.includes("拉链") && productCount === 1 ? [localized(language, "拉片 / Puller", "Puller"), localized(language, "纽扣 / Button", "Button"), localized(language, "反光辅料 / Reflective Trim", "Reflective Trim"), localized(language, "后续季度开发", "Future seasonal development")] : data.project.product.includes("纽扣") ? [localized(language, "其他尺寸", "Additional sizes"), localized(language, "替代表面处理", "Alternative finishes"), localized(language, "后续季度复购", "Future seasonal repeat")]: [localized(language, "当前多产品组合", "Current multi-product assortment"), localized(language, "同系列颜色扩展", "Color extensions within the collection"), localized(language, "后续季度开发", "Future seasonal development")];
  return { estimatedValue, potentialVolume: localizeNarrative(data.project.quantity, language), developmentDepth: localized(language, `${productCount} 个产品类别 · ${data.sampleVersions.length} 个样品版本`, `${productCount} product categories · ${data.sampleVersions.length} sample versions`), expansionPotential, expansion };
}

export function getCurrentSituation(data: ProjectCommandData, language: Language = "zh") {
  const latest = data.timeline[0];
  const signal = [...data.communications].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  const latestQuote = [...data.quotations].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0];
  return {
    stage: getStageSummary(data, language),
    latest: latest ? `${localizeNarrative(latest.title, language)} · ${localizeNarrative(latest.description, language)}` : localizeNarrative(data.project.progress, language),
    signal: signal ? `${localizeNarrative(signal.subject, language)} · ${signal.author}` : localized(language, "当前项目材料中尚未确认", "Not confirmed in the current project materials"),
    commercial: data.purchaseOrders.length ? localized(language, "正式 PO 已收到，进入订单执行。", "The formal PO has been received and order execution is underway.") : latestQuote ? `${latestQuote.version} · ${latestQuote.status} · ${latestQuote.currency} ${latestQuote.unitPrice}/${localizeNarrative(latestQuote.unit, language)}` : localized(language, "尚无正式报价，当前仍处于开发验证阶段。", "No formal quotation exists; the opportunity remains in development validation."),
  };
}
