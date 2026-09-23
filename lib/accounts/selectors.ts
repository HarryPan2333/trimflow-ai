import type { Account, AccountState, OwnershipScope, OwnershipAssignment } from "./types";

export function resolveCanonicalAccountId(state: AccountState, accountId: string): string {
  const seen = new Set<string>();
  let id = accountId;
  while (true) {
    if (seen.has(id)) throw new Error("Account merge cycle");
    seen.add(id);
    const account = state.accounts.find((item) => item.id === id);
    if (!account) throw new Error(`Account not found: ${id}`);
    if (account.recordStatus === "canonical") return id;
    if (!account.canonicalAccountId) throw new Error("Merged account has no canonical target");
    id = account.canonicalAccountId;
  }
}

export function getAccountSourceIds(state: AccountState, accountId: string): string[] {
  const canonicalId = resolveCanonicalAccountId(state, accountId);
  return state.accounts.filter((item) => resolveCanonicalAccountId(state, item.id) === canonicalId).map((item) => item.id);
}

export const sameScope = (a: OwnershipScope, b: OwnershipScope) => a.accountId === b.accountId && a.officeId === b.officeId;

export function getActiveOwner(state: AccountState, scope: OwnershipScope): OwnershipAssignment | undefined {
  const matches = state.ownerships.filter((item) => sameScope(item.scope, scope) && !item.endedAt);
  if (matches.length > 1) throw new Error("Multiple active primary owners in one scope");
  return matches[0];
}

export function getEffectiveOwner(state: AccountState, scope: OwnershipScope): { assignment?: OwnershipAssignment; inherited: boolean } {
  const direct = getActiveOwner(state, scope);
  if (direct) return { assignment: direct, inherited: false };
  const accountOwner = getActiveOwner(state, { accountId: scope.accountId });
  return { assignment: accountOwner, inherited: Boolean(scope.officeId && accountOwner) };
}

export function getFirstDiscovery(state: AccountState, accountId: string) {
  const sources = new Set(getAccountSourceIds(state, accountId));
  return state.discoveries.filter((item) => sources.has(item.accountId)).sort((a, b) => a.discoveredAt.localeCompare(b.discoveredAt) || a.id.localeCompare(b.id))[0];
}

export function getCanonicalAccounts(state: AccountState): Account[] {
  return state.accounts.filter((item) => item.recordStatus === "canonical");
}

export function getAccountTeam(state: AccountState, accountId: string) {
  const owner = getActiveOwner(state, { accountId });
  const members = state.memberships.filter((item) => item.scope.accountId === accountId && !item.endedAt && item.actorId !== owner?.ownerActorId);
  return { owner, members };
}

export function getAccountPeople(state: AccountState, accountId: string) {
  const sources = new Set(getAccountSourceIds(state, accountId));
  return state.affiliations.filter((item) => sources.has(item.accountId) && !item.endedAt).map((affiliation) => ({ affiliation, person: state.people.find((person) => person.id === affiliation.contactId)! })).filter((item) => item.person);
}

export function getActorName(state: AccountState, actorId?: string, language: "zh" | "en" = "zh") {
  return state.actors.find((item) => item.id === actorId)?.displayName[language] ?? (language === "zh" ? "待分配" : "Unassigned");
}

export function getAccountById(state: AccountState, accountId: string) {
  return state.accounts.find((item) => item.id === resolveCanonicalAccountId(state, accountId));
}
