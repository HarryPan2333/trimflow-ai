import type { Account, AccountActivity, AccountEvent, AccountOffice, AccountState, CollaborationRequest, ContactAffiliation, ContactPerson, DuplicateResolution, OwnershipScope, PersonRelationship, ReferralRecord } from "./types";
import type { LocalizedText } from "../i18n";
import { getActiveOwner, sameScope } from "./selectors";
import { assertRevision, assertUnassigned, normalizeRelationship, validateReferral, validateRelationship, validateScope } from "./validation";

type Meta = { id: string; at: string; actorId: string; expectedRevision?: number };
const copy = (state: AccountState) => structuredClone(state);
const bump = (state: AccountState, accountId: string) => { const account = state.accounts.find((item) => item.id === accountId)!; account.revision += 1; };
const seen = (state: AccountState, id: string) => state.events.some((item) => item.id === id);
const actorExists = (state: AccountState, id: string) => { if (!state.actors.some((item) => item.id === id && item.active)) throw new Error("Actor unavailable"); };

export function claimAccount(state: AccountState, scope: OwnershipScope, meta: Meta): AccountState {
  if (seen(state, meta.id)) return state;
  validateScope(state, scope); assertRevision(state, scope.accountId, meta.expectedRevision); actorExists(state, meta.actorId); assertUnassigned(state, scope);
  const next = copy(state);
  next.ownerships.push({ id: `own-${meta.id}`, scope, ownerActorId: meta.actorId, startedAt: meta.at, startEventId: meta.id });
  next.events.push({ id: meta.id, accountId: scope.accountId, occurredAt: meta.at, actorId: meta.actorId, type: "ownership_claimed", payload: { scope, ownerActorId: meta.actorId } });
  bump(next, scope.accountId); return next;
}

export function transferOwnership(state: AccountState, scope: OwnershipScope, toActorId: string, meta: Meta): AccountState {
  if (seen(state, meta.id)) return state;
  validateScope(state, scope); assertRevision(state, scope.accountId, meta.expectedRevision); actorExists(state, toActorId);
  const current = getActiveOwner(state, scope);
  if (!current) throw new Error("No active owner to transfer");
  if (current.ownerActorId === toActorId) throw new Error("New owner must differ");
  if (meta.at < current.startedAt) throw new Error("Transfer predates current assignment");
  const next = copy(state);
  next.ownerships.find((item) => item.id === current.id)!.endedAt = meta.at;
  next.ownerships.find((item) => item.id === current.id)!.endEventId = meta.id;
  next.ownerships.push({ id: `own-${meta.id}`, scope, ownerActorId: toActorId, startedAt: meta.at, startEventId: meta.id });
  next.events.push({ id: meta.id, accountId: scope.accountId, occurredAt: meta.at, actorId: meta.actorId, type: "ownership_transferred", payload: { scope, fromActorId: current.ownerActorId, toActorId } });
  bump(next, scope.accountId); return next;
}

export function releaseOwnership(state: AccountState, scope: OwnershipScope, meta: Meta): AccountState {
  if (seen(state, meta.id)) return state;
  validateScope(state, scope); assertRevision(state, scope.accountId, meta.expectedRevision);
  const current = getActiveOwner(state, scope);
  if (!current) throw new Error("No active owner to release");
  if (meta.at < current.startedAt) throw new Error("Release predates assignment");
  const next = copy(state);
  next.ownerships.find((item) => item.id === current.id)!.endedAt = meta.at;
  next.ownerships.find((item) => item.id === current.id)!.endEventId = meta.id;
  next.events.push({ id: meta.id, accountId: scope.accountId, occurredAt: meta.at, actorId: meta.actorId, type: "ownership_released", payload: { scope, ownerActorId: current.ownerActorId } });
  bump(next, scope.accountId); return next;
}

export function requestCollaboration(state: AccountState, scope: OwnershipScope, reason: string | LocalizedText, meta: Meta): AccountState {
  if (state.requests.some((item) => item.id === meta.id)) return state;
  validateScope(state, scope); assertRevision(state, scope.accountId, meta.expectedRevision); actorExists(state, meta.actorId);
  if (!(typeof reason === "string" ? reason.trim() : reason.zh.trim() && reason.en.trim())) throw new Error("Collaboration reason required");
  const owner = getActiveOwner(state, scope);
  if (!owner || owner.ownerActorId === meta.actorId) throw new Error("Request requires a different primary owner");
  if (state.memberships.some((item) => sameScope(item.scope, scope) && item.actorId === meta.actorId && !item.endedAt)) throw new Error("Already a collaborator");
  if (state.requests.some((item) => sameScope(item.scope, scope) && item.requestedByActorId === meta.actorId && item.status === "pending")) throw new Error("Pending request exists");
  const next = copy(state);
  next.requests.push({ id: meta.id, scope, requestedByActorId: meta.actorId, status: "pending", reason });
  next.events.push({ id: `event-${meta.id}`, accountId: scope.accountId, occurredAt: meta.at, actorId: meta.actorId, type: "collaboration_requested", payload: { requestId: meta.id, requestedByActorId: meta.actorId } });
  bump(next, scope.accountId); return next;
}

export function resolveCollaboration(state: AccountState, requestId: string, decision: "accepted" | "rejected", meta: Meta): AccountState {
  if (seen(state, meta.id)) return state;
  const request = state.requests.find((item) => item.id === requestId);
  if (!request || request.status !== "pending") throw new Error("Request is not pending");
  assertRevision(state, request.scope.accountId, meta.expectedRevision);
  if (getActiveOwner(state, request.scope)?.ownerActorId !== meta.actorId) throw new Error("Only primary owner may resolve collaboration");
  const next = copy(state);
  Object.assign(next.requests.find((item) => item.id === requestId)!, { status: decision, resolvedByActorId: meta.actorId, resolvedAt: meta.at });
  if (decision === "accepted") next.memberships.push({ id: `team-${requestId}`, scope: request.scope, actorId: request.requestedByActorId, functionTags: ["sales"], joinedAt: meta.at });
  next.events.push({ id: meta.id, accountId: request.scope.accountId, occurredAt: meta.at, actorId: meta.actorId, type: decision === "accepted" ? "collaboration_accepted" : "collaboration_rejected", payload: { requestId, requestedByActorId: request.requestedByActorId } });
  bump(next, request.scope.accountId); return next;
}

export function addCollaborator(state: AccountState, scope: OwnershipScope, memberActorId: string, functionTags: AccountState["memberships"][number]["functionTags"], meta: Meta): AccountState {
  if (seen(state, meta.id)) return state;
  validateScope(state, scope); actorExists(state, memberActorId);
  if (getActiveOwner(state, scope)?.ownerActorId !== meta.actorId) throw new Error("Only primary owner may add collaborators");
  if (memberActorId === meta.actorId || state.memberships.some((item) => sameScope(item.scope, scope) && item.actorId === memberActorId && !item.endedAt)) throw new Error("Actor is already on account team");
  const next = copy(state); const membershipId = `team-${meta.id}`;
  next.memberships.push({ id: membershipId, scope, actorId: memberActorId, functionTags, joinedAt: meta.at });
  next.events.push({ id: meta.id, accountId: scope.accountId, occurredAt: meta.at, actorId: meta.actorId, type: "team_member_added", payload: { membershipId, memberActorId } });
  bump(next, scope.accountId); return next;
}

export function addProspect(state: AccountState, account: Account, discovery: AccountState["discoveries"][number], meta: Meta): AccountState {
  if (state.accounts.some((item) => item.id === account.id)) return state;
  actorExists(state, meta.actorId);
  if (account.workspaceId !== "demo" || account.lifecycle !== "prospect" || account.recordStatus !== "canonical" || !account.name.trim() || discovery.accountId !== account.id) throw new Error("Invalid prospect");
  const next = copy(state);
  next.accounts.push(account); next.discoveries.push(discovery);
  next.events.push({ id: meta.id, accountId: account.id, occurredAt: meta.at, actorId: meta.actorId, type: "discovery_recorded", payload: { discoveryId: discovery.id } });
  return next;
}

export function addOffice(state: AccountState, office: AccountOffice): AccountState {
  if (state.offices.some((item) => item.id === office.id)) return state;
  validateScope(state, { accountId: office.accountId });
  if (!office.officeName.en.trim() || !office.city.trim()) throw new Error("Office name and city required");
  const next = copy(state); next.offices.push(office); bump(next, office.accountId); return next;
}

export function addContact(state: AccountState, person: ContactPerson, affiliation: ContactAffiliation): AccountState {
  if (state.people.some((item) => item.id === person.id)) throw new Error("Contact ID already exists");
  validateScope(state, { accountId: affiliation.accountId, officeId: affiliation.officeId });
  if (person.id !== affiliation.contactId || !person.name.trim()) throw new Error("Contact affiliation invalid");
  const next = copy(state); next.people.push(person); next.affiliations.push(affiliation); bump(next, affiliation.accountId); return next;
}

export function addActivity(state: AccountState, activity: AccountActivity): AccountState {
  if (state.activities.some((item) => item.id === activity.id)) return state;
  validateScope(state, { accountId: activity.accountId, officeId: activity.officeId });
  const next = copy(state); next.activities.push(activity); bump(next, activity.accountId); return next;
}

export function addRelationship(state: AccountState, relationship: PersonRelationship): AccountState {
  const normalized = normalizeRelationship(relationship);
  validateRelationship(state, normalized);
  const next = copy(state); next.relationships.push(normalized); return next;
}

export function addReferral(state: AccountState, referral: ReferralRecord, meta: Meta): AccountState {
  if (state.referrals.some((item) => item.id === referral.id)) return state;
  validateReferral(state, referral);
  const next = copy(state); next.referrals.push(referral);
  next.events.push({ id: meta.id, accountId: referral.accountId, occurredAt: meta.at, actorId: meta.actorId, type: "referral_recorded", payload: { referralId: referral.id } });
  bump(next, referral.accountId); return next;
}

export function recordDuplicateResolution(state: AccountState, resolution: DuplicateResolution, event?: AccountEvent): AccountState {
  if (state.duplicateResolutions.some((item) => item.id === resolution.id)) return state;
  if (resolution.candidateAccountIds.length < 1 || !resolution.reason.trim()) throw new Error("Duplicate resolution requires candidates and reason");
  const next = copy(state); next.duplicateResolutions.push(resolution);
  if (event) next.events.push(event);
  else if (resolution.decision === "keep_separate" && resolution.candidateAccountIds.length > 1) {
    const accountId = resolution.candidateAccountIds.at(-1)!;
    next.events.push({ id: `event-${resolution.id}`, accountId, occurredAt: resolution.resolvedAt, actorId: resolution.resolvedByActorId, type: "separate_account_confirmed", payload: { otherAccountId: resolution.candidateAccountIds[0], resolutionId: resolution.id } });
  }
  return next;
}

export function getPendingRequests(state: AccountState, accountId: string): CollaborationRequest[] {
  return state.requests.filter((item) => item.scope.accountId === accountId && item.status === "pending");
}
