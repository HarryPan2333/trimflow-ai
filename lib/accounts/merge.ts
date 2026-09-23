import type { AccountMergeRecord, AccountState } from "./types";
import { getActiveOwner, resolveCanonicalAccountId } from "./selectors";

export function mergeAccounts(state: AccountState, record: AccountMergeRecord): AccountState {
  if (state.merges.some((item) => item.id === record.id)) return state;
  if (!record.sourceAccountIds.length || !record.ownershipResolution.reason.trim()) throw new Error("Explicit merge and owner resolution required");
  const target = state.accounts.find((item) => item.id === record.targetAccountId);
  if (!target || target.recordStatus !== "canonical") throw new Error("Target must be canonical account");
  const sources = record.sourceAccountIds.map((id) => {
    if (id === target.id) throw new Error("Cannot merge account into itself");
    const source = state.accounts.find((item) => item.id === id);
    if (!source || source.recordStatus !== "canonical") throw new Error("Source must be canonical account");
    if (source.workspaceId !== target.workspaceId) throw new Error("Cross-workspace merge forbidden");
    if (resolveCanonicalAccountId(state, target.id) === source.id) throw new Error("Merge cycle forbidden");
    return source;
  });
  if (new Set(sources.map((item) => item.id)).size !== sources.length) throw new Error("Duplicate merge source");
  const activeTargetOwner = getActiveOwner(state, { accountId: target.id });
  const chosenOwner = record.ownershipResolution.ownerActorId;
  if (chosenOwner && !state.actors.some((item) => item.id === chosenOwner)) throw new Error("Invalid resolved owner");
  if (!chosenOwner && (activeTargetOwner || sources.some((source) => getActiveOwner(state, { accountId: source.id })))) throw new Error("Primary owner must be resolved explicitly");
  const next = structuredClone(state);
  for (const source of sources) {
    const account = next.accounts.find((item) => item.id === source.id)!;
    account.recordStatus = "merged"; account.canonicalAccountId = target.id; account.revision += 1;
    for (const assignment of next.ownerships.filter((item) => item.scope.accountId === source.id && !item.endedAt)) assignment.endedAt = record.mergedAt;
    for (const member of next.memberships.filter((item) => item.scope.accountId === source.id && !item.endedAt)) {
      member.endedAt = record.mergedAt;
      if (member.scope.officeId || member.actorId === chosenOwner || next.memberships.some((item) => item.scope.accountId === target.id && !item.scope.officeId && item.actorId === member.actorId && !item.endedAt)) continue;
      next.memberships.push({ ...member, id: `${member.id}-${record.id}`, scope: { accountId: target.id }, joinedAt: record.mergedAt, endedAt: undefined });
    }
    next.events.push({ id: `event-${record.id}-${source.id}`, accountId: target.id, occurredAt: record.mergedAt, actorId: record.mergedByActorId, type: "accounts_merged", payload: { sourceAccountId: source.id, targetAccountId: target.id, mergeId: record.id } });
  }
  if (activeTargetOwner && activeTargetOwner.ownerActorId !== chosenOwner) next.ownerships.find((item) => item.id === activeTargetOwner.id)!.endedAt = record.mergedAt;
  if (chosenOwner && activeTargetOwner?.ownerActorId !== chosenOwner) next.ownerships.push({ id: `own-${record.id}`, scope: { accountId: target.id }, ownerActorId: chosenOwner, startedAt: record.mergedAt });
  next.accounts.find((item) => item.id === target.id)!.revision += 1;
  next.merges.push(record);
  return next;
}
