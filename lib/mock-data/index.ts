import { businessCases, projectStages } from "./trimflow";

export * from "./types";
export { businessCases, projectStages };

export const clients = businessCases.map((item) => item.client);
export const contacts = businessCases.flatMap((item) => item.contacts);
export const projects = businessCases.map((item) => item.project);
export const projectRequirements = businessCases.flatMap((item) => item.requirements);
export const samples = businessCases.flatMap((item) => item.samples);
export const sampleVersions = businessCases.flatMap((item) => item.sampleVersions);
export const sampleFeedback = businessCases.flatMap((item) => item.sampleFeedback);
export const quotations = businessCases.flatMap((item) => item.quotations);
export const quotationTiers = businessCases.flatMap((item) => item.quotationTiers);
export const negotiationRecords = businessCases.flatMap((item) => item.negotiationRecords);
export const purchaseOrders = businessCases.flatMap((item) => item.purchaseOrders);
export const orderLines = businessCases.flatMap((item) => item.orderLines);
export const contracts = businessCases.flatMap((item) => item.contracts);
export const deliveries = businessCases.flatMap((item) => item.deliveries);
export const shipments = businessCases.flatMap((item) => item.shipments);
export const communications = businessCases.flatMap((item) => item.communications);
export const tasks = businessCases.flatMap((item) => item.tasks);
export const timelineEvents = businessCases.flatMap((item) => item.timeline);
export const weeklyReports = businessCases.flatMap((item) => item.weeklyReports);
export const aiInsights = businessCases.flatMap((item) => item.aiInsights);

export function getBusinessCaseByProjectId(projectId: number) {
  return businessCases.find((item) => item.project.id === projectId);
}

export function getProjectRelations(projectId: number) {
  const item = getBusinessCaseByProjectId(projectId);
  if (!item) return undefined;

  return {
    client: item.client,
    contacts: item.contacts,
    project: item.project,
    requirements: item.requirements,
    samples: item.samples,
    sampleVersions: item.sampleVersions,
    sampleFeedback: item.sampleFeedback,
    quotations: item.quotations,
    quotationTiers: item.quotationTiers,
    negotiationRecords: item.negotiationRecords,
    purchaseOrders: item.purchaseOrders,
    orderLines: item.orderLines,
    contracts: item.contracts,
    deliveries: item.deliveries,
    shipments: item.shipments,
    communications: item.communications,
    tasks: item.tasks,
    timeline: item.timeline,
    aiInsights: item.aiInsights,
  };
}

const defaultCase = businessCases[0];

// Temporary adapters keep the current Step 1 UI behavior intact. Later steps will
// render these records per project through getProjectRelations(projectId).
export const legacyRequirementRows = defaultCase.requirements.map((item) => [
  `${item.field} / ${item.fieldEn}`,
  item.value,
  item.status,
]);

export const legacyActivityRows = [...defaultCase.timeline]
  .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  .slice(0, 4)
  .map((item) => ({
    date: item.displayDate,
    title: item.title,
    text: item.description,
    icon: item.icon,
  }));
