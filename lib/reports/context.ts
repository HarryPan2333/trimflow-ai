import { assessMemory } from "../activity-memory/selectors";
import type { ActivityMemoryItem } from "../activity-memory/types";
import type { BusinessSources } from "../activity-memory/source-adapters";
import type { AttributionMode, ReportContextSnapshot, ReportLanguage, ReportPeriod } from "./types";

export function createReportContext(input: { id: string; ownerActorId: string; attributionMode?: AttributionMode; period: ReportPeriod; language: ReportLanguage; accountId?: string; projectId?: number; capturedAt: string }, items: ActivityMemoryItem[], sources: BusinessSources): ReportContextSnapshot {
  if (!sources.accounts.actors.some((actor) => actor.id === input.ownerActorId)) throw new Error("Unknown report owner");
  const attributionMode = input.attributionMode ?? "personal";
  const selected = items.map((item) => assessMemory(item, sources, { start: input.period.localStartDate, end: input.period.localEndDate, timeZone: input.period.timeZone, ownerActorId: attributionMode === "personal" ? input.ownerActorId : undefined, accountId: input.accountId, projectId: input.projectId }));
  const memory = selected.filter((item) => item.eligible).map(({ item }) => structuredClone(item));
  const evidence = memory.flatMap((item) => item.evidence);
  const openTasks = sources.tasks.tasks.filter((task) => task.status !== "已完成" && (attributionMode === "team" || task.ownerActorId === input.ownerActorId) && (!input.accountId || task.accountId === input.accountId) && (input.projectId === undefined || task.projectId === input.projectId) && (!task.createdAt || task.createdAt < input.period.endExclusive)).map((task) => ({ id: task.id, title: task.title, accountId: task.accountId, projectId: task.projectId, dueDate: task.dueDate, source: { provider: "trimflow" as const, recordType: "task", recordId: task.id } }));
  const entityLabels: ReportContextSnapshot["entityLabels"] = {};
  for (const account of sources.accounts.accounts) entityLabels[`account:${account.id}`] = { zh: account.name, en: account.name };
  for (const project of sources.projects) entityLabels[`project:${project.id}`] = { zh: project.code, en: project.code };
  return { ...input, attributionMode, memory, evidence: structuredClone(evidence), openTasks: structuredClone(openTasks), entityLabels, sourceCount: new Set(evidence.filter((item) => item.role === "primary").map((item) => `${item.recordType}:${item.recordId}`)).size, excludedSourceCount: selected.length - memory.length, generatorVersion: "demo-1" };
}
