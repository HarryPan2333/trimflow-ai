import { clients, contacts, projects, projectRequirements, quotations, samples, sampleVersions, sampleFeedback } from "../../lib/mock-data";
import type { Project, Sample, SampleFeedback, SampleSpecification, SampleStatus, SampleVersion } from "../../lib/mock-data";

export type SampleWorkspace = { samples: Sample[]; versions: SampleVersion[]; feedback: SampleFeedback[] };
export type DevelopmentStatus = "Requested" | "In Development" | "Ready" | "Sent" | "Client Reviewing" | "Revision Required" | "Approved" | "Rejected" | "Closed";
export type SampleFilter = "All" | "In Development" | "Waiting for Client" | "Revision Required" | "Approved";
export type SampleContext = ReturnType<typeof getSampleContext>;
export const DEMO_DATE = projects.map((project) => project.lastUpdatedAt.slice(0, 10)).sort().at(-1)!;
export const emptyValue = "待确认 / Not confirmed";
export const demoNotice = "演示工作区 / Demo Workspace · 操作仅在当前会话生效，刷新后恢复模拟数据。";
export const statusLabels: Record<DevelopmentStatus, string> = { Requested: "已申请", "In Development": "开发中", Ready: "待寄出", Sent: "已寄出", "Client Reviewing": "客户评审中", "Revision Required": "需要修改", Approved: "已确认", Rejected: "已拒绝", Closed: "已关闭" };
export const typeLabels: Record<NonNullable<Sample["sampleType"]>, string> = { "Initial Sample": "初样", "Development Sample": "开发样", "Sales Sample": "销售样", "Bulk Approval Sample": "大货确认样" };
export const categoryLabels = { Color: "颜色", Size: "尺寸", Material: "材质", Logo: "Logo", Function: "功能", Testing: "测试", Quality: "质量", Design: "设计", Cost: "成本", Other: "其他" };
export const severityLabels = { Blocking: "阻塞", Important: "重要", Minor: "建议" };

export const specificationFields = [
  ["product", "产品", "Product"], ["category", "类别", "Category"], ["material", "材质", "Material"],
  ["size", "尺寸", "Size"], ["color", "颜色", "Color"], ["pantone", "色号", "Pantone"],
  ["finish", "表面处理", "Finish"], ["logo", "标识", "Logo"], ["logoMethod", "标识工艺", "Logo Method"],
  ["lightSource", "对色光源", "Light Source"], ["functional", "功能要求", "Functional Requirement"],
  ["testing", "测试要求", "Testing Requirement"], ["sampleQuantity", "样品数量", "Sample Quantity"],
  ["moq", "起订量", "MOQ"],
] as const;

const extraLabels: Record<string, string> = { logoPosition: "Logo 位置 / Logo Position", logoDepth: "Logo 深度 / Logo Depth", weight: "克重 / Weight" };
const legacyStatus: Record<SampleStatus, DevelopmentStatus> = { 待制作: "Requested", 制作中: "In Development", 已完成: "Ready", 已寄出: "Sent", 客户评估中: "Client Reviewing", 需修改: "Revision Required", 已确认: "Approved", 已关闭: "Closed" };

export function createSampleWorkspace(): SampleWorkspace {
  return { samples: structuredClone(samples), versions: structuredClone(sampleVersions), feedback: structuredClone(sampleFeedback) };
}

export function getSampleContext(sample: Sample, workspace: SampleWorkspace, allProjects: Project[] = projects) {
  const versions = workspace.versions.filter((version) => version.sampleId === sample.id).sort((a, b) => Number(a.version.slice(1)) - Number(b.version.slice(1)));
  const current = versions.find((version) => version.id === sample.currentVersionId) ?? versions.at(-1);
  return { sample, current, versions,
    feedback: workspace.feedback.filter((feedback) => feedback.sampleId === sample.id),
    client: clients.find((client) => client.id === sample.clientId),
    project: allProjects.find((project) => project.id === sample.projectId),
    contacts: contacts.filter((contact) => contact.clientId === sample.clientId),
    requirements: projectRequirements.filter((requirement) => requirement.projectId === sample.projectId && (sample.product.includes(requirement.product) || requirement.product.includes(sample.product))),
    quotations: quotations.filter((quote) => quote.projectId === sample.projectId && quote.product === sample.product),
  };
}

export function isFeedbackOpen(feedback: SampleFeedback) {
  return feedback.resolution ? feedback.resolution === "Open" : feedback.requiresRevision;
}

export function getOpenRevisionFeedback(context: SampleContext) {
  return context.feedback.filter((feedback) => isFeedbackOpen(feedback) && feedback.requiresRevision);
}

export function getSampleStatus(context: SampleContext): DevelopmentStatus {
  if (context.sample.status === "已关闭") return "Closed";
  if (context.current?.reviewOutcome === "Rejected") return "Rejected";
  if (getOpenRevisionFeedback(context).length) return "Revision Required";
  if (context.current?.status === "已确认" || context.current?.reviewOutcome === "Approved") return "Approved";
  if (context.current?.sentDate) {
    const versionFeedback = context.feedback.filter((feedback) => feedback.sampleVersionId === context.current?.id);
    return versionFeedback.length === 0 || context.current.status === "客户评估中" ? "Client Reviewing" : "Sent";
  }
  return legacyStatus[context.current?.status ?? context.sample.status];
}

export function getSpecification(context: SampleContext, version = context.current): Record<string, SampleSpecification> {
  // Version snapshots are authoritative; never fill historical gaps with a later specification.
  if (version?.specifications) return { product: { value: context.sample.product, status: "Confirmed" }, ...version.specifications };
  return { product: { value: context.sample.product, status: "Confirmed" }, ...Object.fromEntries(Object.entries(context.sample.specs).map(([key, value]) => [key, { value, status: "Pending" as const }])) };
}

export function getSpecificationRows(context: SampleContext, version = context.current) {
  const specs = getSpecification(context, version);
  const fields: Array<readonly [string, string, string]> = [...specificationFields];
  for (const key of Object.keys(specs)) if (!fields.some(([id]) => id === key)) fields.push([key, extraLabels[key]?.split(" / ")[0] ?? key, extraLabels[key]?.split(" / ")[1] ?? key]);
  return fields.map(([key, zh, en]) => ({ key, label: `${zh} / ${en}`, ...(specs[key] ?? { value: "", status: "Pending" as const }) }));
}

export function compareVersions(context: SampleContext) {
  const previous = context.versions.at(-2);
  if (!previous || !context.current) return [];
  const before = getSpecification(context, previous);
  return getSpecificationRows(context).filter((row) => (before[row.key]?.value ?? "") !== row.value || (before[row.key]?.status ?? "Pending") !== row.status)
    .map((row) => ({ ...row, previous: before[row.key] ?? { value: "", status: "Pending" as const } }));
}

export function getSampleReadiness(context: SampleContext) {
  const specs = getSpecification(context);
  const complete = (key: string) => Boolean(specs[key]?.value.trim() && specs[key].status !== "Pending");
  const criteria = [
    { key: "spec", label: "产品规格 / Product Spec", ready: ["product", "material", "size"].every(complete), reason: "产品、材质和尺寸须确认。" },
    { key: "color", label: "颜色 / Color", ready: complete("color"), reason: "颜色方向及客户要求的色号须确认。" },
    { key: "logo", label: "标识 / Logo", ready: complete("logo"), reason: "确认 Logo 要求，或明确记录本样品不需要 Logo。" },
    { key: "testing", label: "测试 / Testing", ready: complete("testing"), reason: "测试要求须确认，不能以空白视为无要求。" },
    { key: "approval", label: "客户确认 / Client Approval", ready: context.current?.status === "已确认" || context.current?.reviewOutcome === "Approved", reason: "当前版本尚未获得客户确认。" },
  ];
  if (specs.pantone?.status === "Pending") criteria[1].ready = false;
  if (specs.weight) criteria[0].ready = criteria[0].ready && complete("weight");
  const open = context.feedback.filter((feedback) => isFeedbackOpen(feedback) && (feedback.severity === "Blocking" || feedback.severity === "Important" || feedback.requiresRevision));
  if (open.length) criteria.push({ key: "feedback", label: "反馈处理 / Feedback", ready: false, reason: `${open.length} 条影响确认的反馈尚未解决。` });
  const specsReady = criteria.filter((item) => item.key !== "approval").every((item) => item.ready);
  const ready = specsReady && criteria.every((item) => item.ready) && !["Rejected", "Closed"].includes(getSampleStatus(context));
  return { criteria, specsReady, ready, reasons: criteria.filter((item) => !item.ready).map((item) => item.reason) };
}

export function businessDaysSince(value?: string) {
  if (!value) return 0;
  const cursor = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${DEMO_DATE}T00:00:00Z`);
  let days = 0;
  while (cursor < end) { cursor.setUTCDate(cursor.getUTCDate() + 1); if (![0, 6].includes(cursor.getUTCDay())) days += 1; }
  return days;
}

export type DevelopmentBlocker = { type: "Missing Requirement" | "Client Feedback" | "Technical" | "Factory" | "Testing" | "Timeline" | "Commercial"; severity: "Blocking" | "Important" | "Minor"; reason: string; owner: string; action: string };

export function getDevelopmentBlockers(context: SampleContext): DevelopmentBlocker[] {
  const owner = context.sample.owner ?? context.project?.owner ?? "待分配";
  const blockers: DevelopmentBlocker[] = [];
  context.feedback.filter((feedback) => isFeedbackOpen(feedback) && feedback.severity !== "Minor").forEach((feedback) => blockers.push({ type: "Client Feedback", severity: feedback.severity ?? "Important", reason: feedback.summary, owner, action: feedback.requiredAction ?? feedback.details }));
  const readiness = getSampleReadiness(context);
  const missingSpecs = readiness.criteria.find((item) => item.key === "spec" && !item.ready);
  if (missingSpecs) blockers.push({ type: "Missing Requirement", severity: "Blocking", reason: "关键产品规格未确认，开发依据尚不完整。", owner, action: missingSpecs.reason });
  if (readiness.criteria.some((item) => item.key === "testing" && !item.ready)) blockers.push({ type: "Testing", severity: "Important", reason: "当前样品测试要求待确认。", owner, action: "书面确认测试方法和验收标准。" });
  if (context.sample.targetDate && context.sample.targetDate < DEMO_DATE && !["Approved", "Closed", "Rejected"].includes(getSampleStatus(context))) blockers.push({ type: "Timeline", severity: "Important", reason: `样品目标日期 ${context.sample.targetDate} 已过。`, owner, action: "确认剩余工作和新的完成日期，并同步客户。" });
  if (context.quotations.some((quote) => quote.targetPrice && quote.targetPrice < quote.unitPrice)) blockers.push({ type: "Commercial", severity: "Minor", reason: "目标价与报价存在差距；不影响样品技术确认。", owner, action: "报价交接时一并讨论数量与费用条件。" });
  const priority = { Blocking: 0, Important: 1, Minor: 2 };
  return blockers.sort((a, b) => priority[a.severity] - priority[b.severity]).slice(0, 4);
}

export function getSampleNextAction(context: SampleContext) {
  const owner = context.sample.owner ?? context.project?.owner ?? "待分配";
  const feedback = getOpenRevisionFeedback(context).sort((a, b) => (a.severity === "Blocking" ? -1 : 0) - (b.severity === "Blocking" ? -1 : 0))[0];
  if (feedback) return { action: feedback.requiredAction ?? feedback.summary, why: "客户反馈尚未解决，影响当前版本确认。", owner, timing: feedback.severity === "Blocking" ? "优先处理 / First priority" : "下一轮版本评审前" };
  if (getSampleStatus(context) === "Client Reviewing" && businessDaysSince(context.current?.sentDate) >= 5) return { action: "跟进客户样品评审", why: "寄出后已超过 5 个工作日，仍无当前版本反馈。", owner, timing: "本次客户联系" };
  const readiness = getSampleReadiness(context);
  if (readiness.ready && !context.quotations.length) return { action: "创建报价 / Create Quotation", why: "规格、测试和客户确认已满足报价交接条件。", owner, timing: "本次样品交接" };
  if (readiness.specsReady && !context.current?.sentDate) return { action: "安排样品寄出", why: "关键规格已确认，寄出后进入客户评审。", owner, timing: context.sample.targetDate ?? "确认寄样日期" };
  if (getSampleStatus(context) === "Approved") return { action: "将确认样与现有报价对齐", why: "保留确认版本、规格及测试依据，支持报价或订单执行。", owner, timing: "本次商务交接" };
  return { action: context.sample.nextAction, why: readiness.reasons[0] ?? "推进当前开发节点。", owner, timing: context.sample.targetDate ?? "待确认" };
}

export function feedbackSummary(context: SampleContext) {
  const open = context.feedback.filter(isFeedbackOpen).length;
  return open ? `${open} 条待处理 / Open` : context.feedback.length ? "已处理 / Resolved" : "待反馈 / Awaiting feedback";
}

export function matchesSampleFilter(context: SampleContext, filter: SampleFilter) {
  const status = getSampleStatus(context);
  return filter === "All" || (filter === "Waiting for Client" ? ["Sent", "Client Reviewing"].includes(status) : filter === "In Development" ? ["Requested", "In Development", "Ready"].includes(status) : status === filter);
}

export type SampleAction =
  | { type: "feedback"; feedback: SampleFeedback }
  | { type: "resolve"; feedbackId: string; versionId: string }
  | { type: "revision"; sampleId: string; version: SampleVersion }
  | { type: "sent"; sampleId: string; date: string; logistics: NonNullable<Sample["logistics"]> }
  | { type: "approved"; sampleId: string; feedback: SampleFeedback };

// A single immutable session store is shared by Sample Center and project tabs.
export function sampleWorkspaceReducer(state: SampleWorkspace, action: SampleAction): SampleWorkspace {
  if (action.type === "feedback") return { ...state, feedback: [...state.feedback, action.feedback] };
  if (action.type === "resolve") return { ...state, feedback: state.feedback.map((item) => item.id === action.feedbackId ? { ...item, resolution: "Resolved", resolvedInVersionId: action.versionId } : item) };
  const sample = state.samples.find((item) => item.id === action.sampleId);
  if (!sample) return state;
  const context = getSampleContext(sample, state);
  if (action.type === "revision") {
    if (state.versions.some((item) => item.id === action.version.id)) return state;
    return { ...state, versions: [...state.versions, action.version], samples: state.samples.map((item) => item.id === sample.id ? { ...item, currentVersionId: action.version.id, currentVersion: action.version.version, status: "制作中", sentDate: undefined, feedbackStatus: "修改中，待重新评审", nextAction: "完成修改并安排新版本评审" } : item) };
  }
  if (action.type === "sent") {
    if (!context.current || context.current.sentDate) return state;
    return { ...state, versions: state.versions.map((item) => item.id === sample.currentVersionId ? { ...item, sentDate: action.date, status: "客户评估中" } : item), samples: state.samples.map((item) => item.id === sample.id ? { ...item, status: "客户评估中", sentDate: action.date, logistics: action.logistics, nextAction: "跟进客户对当前版本的评审反馈" } : item) };
  }
  if (!context.current?.sentDate || !getSampleReadiness(context).specsReady) return state;
  return { ...state, feedback: [...state.feedback, action.feedback], versions: state.versions.map((item) => item.id === sample.currentVersionId ? { ...item, status: "已确认", reviewOutcome: "Approved" } : item), samples: state.samples.map((item) => item.id === sample.id ? { ...item, status: "已确认", feedbackStatus: "客户已确认", nextAction: "将确认样交接至报价" } : item) };
}

export function createRevision(context: SampleContext, specifications: Record<string, SampleSpecification>, reason: string, note: string): SampleVersion {
  const number = Math.max(0, ...context.versions.map((item) => Number(item.version.slice(1)) || 0)) + 1;
  const previous = getSpecification(context);
  const changes = Object.entries(specifications).filter(([key, value]) => value.value !== previous[key]?.value || value.status !== previous[key]?.status)
    .map(([key, value]) => `${specificationFields.find(([id]) => id === key)?.[1] ?? extraLabels[key] ?? key}：${value.value || emptyValue}`);
  return { id: `${context.sample.id}-V${number}`, sampleId: context.sample.id, projectId: context.sample.projectId, version: `V${number}`, createdAt: DEMO_DATE, status: "制作中", summary: reason, changes: changes.length ? changes : ["继承上一版规格；按反馈要求继续开发"], specifications, reasonForChange: reason, internalNote: note, revisionFeedbackIds: getOpenRevisionFeedback(context).map((item) => item.id) };
}
