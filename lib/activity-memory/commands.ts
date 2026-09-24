import type { ActivityMemoryState, ManualActivityEntry } from "./types";

export function addManualActivity(state: ActivityMemoryState, entry: ManualActivityEntry): ActivityMemoryState {
  if (state.manualEntries.some((item) => item.id === entry.id)) return state;
  if (!entry.authorActorId || !entry.description.trim() || entry.occurred.kind === "unknown" || (!entry.accountId && entry.projectId === undefined)) throw new Error("Manual activity requires author, business date, scope and description");
  return { ...state, manualEntries: [...state.manualEntries, { ...entry, description: entry.description.trim() }] };
}
