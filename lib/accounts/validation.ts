import type { AccountState, OwnershipScope, PersonEndpoint, PersonRelationship, ReferralRecord } from "./types";
import type { Project } from "../mock-data";
import { getActiveOwner, sameScope } from "./selectors";

export function validateScope(state: AccountState, scope: OwnershipScope) {
  const account = state.accounts.find((item) => item.id === scope.accountId);
  if (!account || account.recordStatus !== "canonical") throw new Error("Scope requires a canonical account");
  if (scope.officeId && !state.offices.some((item) => item.id === scope.officeId && item.accountId === scope.accountId)) throw new Error("Office does not belong to account");
}

export function assertRevision(state: AccountState, accountId: string, expectedRevision?: number) {
  if (expectedRevision === undefined) return;
  if (state.accounts.find((item) => item.id === accountId)?.revision !== expectedRevision) throw new Error("Account revision conflict");
}

export function assertOwnershipIntervals(state: AccountState) {
  for (const item of state.ownerships) {
    if (item.endedAt && item.endedAt < item.startedAt) throw new Error("Invalid ownership interval");
    if (state.ownerships.some((other) => other.id !== item.id && sameScope(other.scope, item.scope) && item.startedAt < (other.endedAt ?? "9999") && other.startedAt < (item.endedAt ?? "9999"))) throw new Error("Overlapping ownership intervals");
  }
}

export function validateEndpoint(state: AccountState, endpoint: PersonEndpoint) {
  if (endpoint.kind === "actor" ? !state.actors.some((actor) => actor.id === endpoint.id) : !state.people.some((person) => person.id === endpoint.id)) throw new Error("Invalid relationship endpoint");
}

export const endpointKey = (endpoint: PersonEndpoint) => `${endpoint.kind}:${endpoint.id}`;
export function normalizeRelationship<T extends PersonRelationship>(relationship: T): T {
  if (!["knows", "works_with"].includes(relationship.type) || endpointKey(relationship.from) <= endpointKey(relationship.to)) return relationship;
  return { ...relationship, from: relationship.to, to: relationship.from };
}
export function relationshipKey(relationship: Pick<PersonRelationship, "type" | "from" | "to">) {
  const a = endpointKey(relationship.from), b = endpointKey(relationship.to);
  return ["knows", "works_with"].includes(relationship.type) ? `${relationship.type}:${[a, b].sort().join(":")}` : `${relationship.type}:${a}:${b}`;
}

export function validateRelationship(state: AccountState, relationship: PersonRelationship) {
  validateEndpoint(state, relationship.from); validateEndpoint(state, relationship.to);
  if (endpointKey(relationship.from) === endpointKey(relationship.to)) throw new Error("Self relationship is invalid");
  if (relationship.strength && relationship.type !== "knows") throw new Error("Strength applies only to knows relationships");
  if (state.relationships.some((item) => relationshipKey(item) === relationshipKey(relationship))) throw new Error("Relationship already exists");
}

export function validateReferral(state: AccountState, referral: ReferralRecord) {
  validateEndpoint(state, referral.introducer); validateEndpoint(state, referral.recipient);
  if (!state.people.some((person) => person.id === referral.introducedContactId)) throw new Error("Introduced contact is missing");
  if (new Set([endpointKey(referral.introducer), `contact:${referral.introducedContactId}`, endpointKey(referral.recipient)]).size !== 3) throw new Error("Referral requires three distinct parties");
  if (!state.affiliations.some((item) => item.contactId === referral.introducedContactId && item.accountId === referral.accountId)) throw new Error("Introduced contact is not affiliated with account");
  if (referral.recipient.kind !== "actor" || !state.actors.some((actor) => actor.id === referral.recordedByActorId)) throw new Error("Referral recipient/recorder invalid");
}

export function assertUnassigned(state: AccountState, scope: OwnershipScope) {
  if (getActiveOwner(state, scope)) throw new Error("Scope already has a primary owner");
}

export function validateProjectAccountReference(state: AccountState, project: Pick<Project, "clientId">) {
  const account = state.accounts.find((item) => item.id === project.clientId);
  if (!account || account.recordStatus !== "canonical") throw new Error("Project must reference an existing canonical account");
}
