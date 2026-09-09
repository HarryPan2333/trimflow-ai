import type {
  Client,
  Communication,
  Delivery,
  LifecycleStage,
  Project,
  PurchaseOrder,
  Quotation,
  Requirement,
  Sample,
  SampleVersion,
  Shipment,
  Task,
  TimelineEvent,
} from "../../lib/mock-data";

export type DashboardData = {
  projects: Project[];
  clients: Client[];
  requirements: Requirement[];
  samples: Sample[];
  sampleVersions: SampleVersion[];
  quotations: Quotation[];
  purchaseOrders: PurchaseOrder[];
  deliveries: Delivery[];
  shipments: Shipment[];
  communications: Communication[];
  tasks: Task[];
  timelineEvents: TimelineEvent[];
};

export type DashboardKpi = {
  id: "opportunities" | "samples" | "quotes" | "orders";
  label: string;
  labelEn: string;
  value: number;
  trend: string;
  detail: string;
  target: "projects" | "samples" | "quotations" | "orders";
};

export type SecondaryIndicator = {
  label: string;
  value: number;
  detail: string;
};

export type FocusItem = {
  id: string;
  priority: "高" | "中" | "普通";
  client: string;
  project: Project;
  issue: string;
  reason: string;
  action: string;
};

export const pipelineStages: Array<{
  id: LifecycleStage;
  label: string;
  labelZh: string;
}> = [
  { id: "inquiry", label: "Lead / Inquiry", labelZh: "询盘" },
  { id: "requirement", label: "Registered", labelZh: "客户注册" },
  { id: "sample", label: "Sample", labelZh: "样品" },
  { id: "quotation", label: "Quotation", labelZh: "报价" },
  { id: "negotiation", label: "Negotiation", labelZh: "谈判" },
  { id: "po", label: "PO", labelZh: "订单" },
  { id: "delivery", label: "Production", labelZh: "大货" },
  { id: "shipment", label: "Shipment", labelZh: "出货" },
];

const DAY = 86_400_000;

function toTime(value: string | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function getDashboardReferenceTime(data: DashboardData) {
  return Math.max(
    ...data.projects.map((project) => toTime(project.lastUpdatedAt)),
    ...data.timelineEvents.map((event) => toTime(event.occurredAt)),
    ...data.communications.map((item) => toTime(item.occurredAt)),
    ...data.purchaseOrders.map((order) => toTime(order.poDate)),
  );
}

function activityDelta(data: DashboardData, types: TimelineEvent["type"][]) {
  const reference = getDashboardReferenceTime(data);
  const currentStart = reference - 14 * DAY;
  const previousStart = reference - 28 * DAY;
  const current = data.timelineEvents.filter((event) => {
    const time = toTime(event.occurredAt);
    return types.includes(event.type) && time > currentStart && time <= reference;
  }).length;
  const previous = data.timelineEvents.filter((event) => {
    const time = toTime(event.occurredAt);
    return types.includes(event.type) && time > previousStart && time <= currentStart;
  }).length;
  const delta = current - previous;
  return delta === 0 ? "与上周期持平" : `较上周期 ${delta > 0 ? "+" : ""}${delta}`;
}

export function getDashboardKpis(data: DashboardData): DashboardKpi[] {
  const activeProjects = data.projects.filter((project) => project.stage !== "暂停或流失");
  const samplesInProgress = data.samples.filter(
    (sample) => !["已确认", "已关闭", "已完成"].includes(sample.status),
  );
  const quotesNegotiating = data.quotations.filter((quotation) => quotation.status === "Negotiating");
  const activeOrders = data.purchaseOrders.filter((order) => order.currentStage !== "Completed");

  return [
    {
      id: "opportunities",
      label: "活跃机会",
      labelEn: "Active Opportunities",
      value: activeProjects.length,
      trend: activityDelta(data, ["inquiry", "requirement"]),
      detail: `${new Set(activeProjects.map((project) => project.clientId)).size} 个客户正在推进`,
      target: "projects",
    },
    {
      id: "samples",
      label: "打样中",
      labelEn: "Samples in Progress",
      value: samplesInProgress.length,
      trend: activityDelta(data, ["sample"]),
      detail: `${new Set(samplesInProgress.map((sample) => sample.projectId)).size} 个项目需要样品动作`,
      target: "samples",
    },
    {
      id: "quotes",
      label: "报价谈判中",
      labelEn: "Quotes in Negotiation",
      value: quotesNegotiating.length,
      trend: activityDelta(data, ["quotation", "negotiation"]),
      detail: `${new Set(quotesNegotiating.map((quotation) => quotation.clientId)).size} 个客户等待价格收口`,
      target: "quotations",
    },
    {
      id: "orders",
      label: "执行中订单",
      labelEn: "Orders in Execution",
      value: activeOrders.length,
      trend: activityDelta(data, ["po", "contract", "delivery", "shipment"]),
      detail: `${activeOrders.filter((order) => order.health !== "风险").length} 个订单状态可控`,
      target: "orders",
    },
  ];
}

export function getSecondaryIndicators(data: DashboardData): SecondaryIndicator[] {
  const reference = getDashboardReferenceTime(data);
  const weekStart = new Date(reference);
  const day = weekStart.getUTCDay() || 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - day + 1);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = weekStart.getTime() + 7 * DAY;

  const pendingProjects = new Set(
    data.requirements
      .filter((requirement) => ["待确认", "有冲突", "未提供"].includes(requirement.status))
      .map((requirement) => requirement.projectId),
  );
  const staleClients = data.clients.filter(
    (client) => reference - toTime(client.lastContactAt) > 2 * DAY,
  );
  const expiringQuotes = data.quotations.filter((quotation) => {
    const expiresIn = toTime(quotation.validUntil) - reference;
    return ["Draft", "Sent", "Negotiating"].includes(quotation.status) && expiresIn >= 0 && expiresIn <= 30 * DAY;
  });
  const weekTasks = data.tasks.filter((task) => {
    const due = toTime(task.dueDate);
    return task.status !== "已完成" && due >= weekStart.getTime() && due < weekEnd;
  });

  return [
    { label: "待客户确认", value: pendingProjects.size, detail: "需求或规格待确认" },
    { label: "超过 48h 未跟进", value: staleClients.length, detail: "需要恢复客户节奏" },
    { label: "即将到期报价", value: expiringQuotes.length, detail: "30 天内到期" },
    { label: "本周待办", value: weekTasks.length, detail: "未完成任务" },
    { label: "已收到 PO", value: data.purchaseOrders.length, detail: "正式订单" },
    { label: "待出货", value: data.shipments.filter((shipment) => shipment.status !== "Delivered").length, detail: "计划或执行中" },
  ];
}

export function getTodayFocus(data: DashboardData): FocusItem[] {
  const reference = getDashboardReferenceTime(data);
  const projectById = new Map(data.projects.map((project) => [project.id, project]));
  const clientById = new Map(data.clients.map((client) => [client.id, client]));
  const items: FocusItem[] = [];

  data.tasks
    .filter((task) => task.status !== "已完成" && toTime(task.dueDate) < reference)
    .sort((a, b) => toTime(a.dueDate) - toTime(b.dueDate))
    .slice(0, 2)
    .forEach((task) => {
      const project = projectById.get(task.projectId);
      if (!project) return;
      items.push({
        id: `overdue-${task.id}`,
        priority: "高",
        client: project.customer,
        project,
        issue: `${task.title}已逾期`,
        reason: `截止日期为 ${task.dueDate}，当前状态仍为${task.status}。`,
        action: project.next,
      });
    });

  data.clients
    .filter((client) => reference - toTime(client.lastContactAt) > 2 * DAY)
    .slice(0, 1)
    .forEach((client) => {
      const project = data.projects.find((item) => item.clientId === client.id);
      if (!project) return;
      const days = Math.floor((reference - toTime(client.lastContactAt)) / DAY);
      items.push({
        id: `follow-${client.id}`,
        priority: "高",
        client: client.name,
        project,
        issue: `已 ${days} 天没有新的客户沟通`,
        reason: "跟进节奏中断可能影响当前开发节点。",
        action: project.next,
      });
    });

  data.samples
    .filter((sample) => sample.status === "客户评估中" || sample.feedbackStatus.includes("等待"))
    .slice(0, 1)
    .forEach((sample) => {
      const project = projectById.get(sample.projectId);
      const client = clientById.get(sample.clientId);
      if (!project || !client) return;
      items.push({
        id: `sample-${sample.id}`,
        priority: "中",
        client: client.name,
        project,
        issue: `${sample.id} 正等待客户确认`,
        reason: sample.feedbackStatus,
        action: sample.nextAction,
      });
    });

  data.quotations
    .filter((quotation) => {
      const remaining = toTime(quotation.validUntil) - reference;
      return ["Draft", "Sent", "Negotiating"].includes(quotation.status) && remaining >= 0 && remaining <= 30 * DAY;
    })
    .slice(0, 1)
    .forEach((quotation) => {
      const project = projectById.get(quotation.projectId);
      if (!project) return;
      const days = Math.ceil((toTime(quotation.validUntil) - reference) / DAY);
      items.push({
        id: `quote-${quotation.id}`,
        priority: days <= 7 ? "高" : "中",
        client: project.customer,
        project,
        issue: `${quotation.id} 将在 ${days} 天后失效`,
        reason: "报价仍在谈判中，失效前需要确认客户下一步。",
        action: "确认客户是否接受当前方案，或需要延长报价有效期。",
      });
    });

  data.shipments
    .filter((shipment) => {
      const remaining = toTime(shipment.etd) - reference;
      return shipment.status !== "Delivered" && remaining >= 0 && remaining <= 21 * DAY;
    })
    .slice(0, 1)
    .forEach((shipment) => {
      const project = projectById.get(shipment.projectId);
      if (!project) return;
      items.push({
        id: `shipment-${shipment.id}`,
        priority: "普通",
        client: project.customer,
        project,
        issue: `${shipment.id} 接近计划出货节点`,
        reason: `当前状态为 ${shipment.status}，ETD 为 ${shipment.etd ?? "待确认"}。`,
        action: "确认交付准备和出货资料是否齐全。",
      });
    });

  return items.slice(0, 5);
}

export function getPipelineCounts(data: DashboardData) {
  return pipelineStages.map((stage) => ({
    ...stage,
    projects: data.projects.filter((project) => project.lifecycleStage === stage.id),
  }));
}

export function formatCompactAmount(value: number, currency: string) {
  const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return `${currency} ${compact}`;
}

export function percentage(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}
