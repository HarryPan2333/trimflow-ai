import type { ActivityMemoryItem, BusinessTime } from "./types";
import type { BusinessSources } from "./source-adapters";
import { validateMemoryItem } from "./validation";

export type MemoryDecision = { item: ActivityMemoryItem; eligible: boolean; reasons: string[] };
export function businessDate(time: BusinessTime, timeZone: string): string | undefined {
  if (time.kind === "unknown") return undefined;
  if (time.kind === "date") return time.value;
  const date = new Date(time.value);
  if (Number.isNaN(date.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (kind: string) => parts.find((part) => part.type === kind)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function assessMemory(item: ActivityMemoryItem, sources: BusinessSources, input: { start: string; end: string; timeZone: string; ownerActorId?: string; accountId?: string; projectId?: number }): MemoryDecision {
  const reasons = validateMemoryItem(item, sources);
  if (item.status !== "active") reasons.push(item.status);
  if (item.reportingRole !== "activity") reasons.push(item.reportingRole === "background" ? "background_only" : "internal_governance");
  const date = businessDate(item.occurred, input.timeZone);
  if (!date) reasons.push("unknown_business_time");
  else if (date < input.start || date >= input.end) reasons.push("outside_period");
  if (input.accountId && item.accountId !== input.accountId) reasons.push("account_filter");
  if (input.projectId !== undefined && item.projectId !== input.projectId) reasons.push("project_filter");
  if (input.ownerActorId && item.attribution.performedByActorId !== input.ownerActorId && !item.attribution.participantActorIds.includes(input.ownerActorId)) reasons.push(item.attribution.performedByActorId ? "other_actor" : "actor_unknown");
  return { item, eligible: reasons.length === 0, reasons };
}

export function selectMemory(items: ActivityMemoryItem[], sources: BusinessSources, input: Parameters<typeof assessMemory>[2]): MemoryDecision[] {
  return items.map((item) => assessMemory(item, sources, input)).sort((a, b) => (businessDate(b.item.occurred, input.timeZone) ?? "").localeCompare(businessDate(a.item.occurred, input.timeZone) ?? "") || a.item.id.localeCompare(b.item.id));
}
