import type { ActivityMemoryItem, ActivityMemoryState } from "./types";

export const emptyActivityMemory = (): ActivityMemoryState => ({ items: [], manualEntries: [] });

export function reconcileMemory(state: ActivityMemoryState, candidates: ActivityMemoryItem[]): ActivityMemoryState {
  let changed = false;
  const next = [...state.items];
  for (const candidate of candidates) {
    const current = next.find((item) => item.logicalEventId === candidate.logicalEventId && item.status === "active");
    if (!current) {
      if (next.some((item) => item.logicalEventId === candidate.logicalEventId && item.status === "voided")) continue;
      const previous = next.filter((item) => item.logicalEventId === candidate.logicalEventId).sort((a, b) => b.revision - a.revision)[0];
      next.push(previous ? { ...candidate, revision: previous.revision + 1, id: `${candidate.logicalEventId}:r${previous.revision + 1}`, supersedesId: previous.id } : candidate);
      changed = true;
      continue;
    }
    if (current.sourceFingerprint === candidate.sourceFingerprint) continue;
    const index = next.indexOf(current);
    next[index] = { ...current, status: "superseded" };
    const revision = Math.max(...next.filter((item) => item.logicalEventId === candidate.logicalEventId).map((item) => item.revision)) + 1;
    next.push({ ...candidate, revision, id: `${candidate.logicalEventId}:r${revision}`, supersedesId: current.id });
    changed = true;
  }
  return changed ? { ...state, items: next } : state;
}

export function correctMemory(state: ActivityMemoryState, id: string, summary: ActivityMemoryItem["summary"], reason: string): ActivityMemoryState {
  const current = state.items.find((item) => item.id === id && item.status === "active");
  if (!current || !reason.trim()) throw new Error("An active item and correction reason are required");
  const revision = current.revision + 1;
  return { ...state, items: [...state.items.map((item) => item.id === id ? { ...item, status: "superseded" as const } : item),
    { ...current, id: `${current.logicalEventId}:r${revision}`, revision, summary, correctionReason: reason.trim(), supersedesId: id }] };
}

export function voidMemory(state: ActivityMemoryState, id: string, reason: string): ActivityMemoryState {
  if (!reason.trim() || !state.items.some((item) => item.id === id && item.status === "active")) throw new Error("An active item and void reason are required");
  return { ...state, items: state.items.map((item) => item.id === id ? { ...item, status: "voided", correctionReason: reason.trim() } as ActivityMemoryItem : item) };
}
