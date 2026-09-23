import type { AccountState } from "./types";
import { getAccountPeople, getAccountSourceIds } from "./selectors";

export type AccountGraphDTO = { nodes: Array<{ id: string; kind: "account" | "office" | "group" | "contact" | "actor"; label: string }>; edges: Array<{ id: string; from: string; to: string; type: string }> };

export function getAccountGraph(state: AccountState, accountId: string): AccountGraphDTO {
  const account = state.accounts.find((item) => item.id === accountId)!;
  const sources = new Set(getAccountSourceIds(state, accountId));
  const offices = state.offices.filter((item) => sources.has(item.accountId));
  const people = getAccountPeople(state, accountId);
  const contactIds = new Set(people.map((item) => item.person.id));
  const relations = state.relationships.filter((item) => (item.from.kind === "contact" && contactIds.has(item.from.id)) || (item.to.kind === "contact" && contactIds.has(item.to.id)));
  const actorIds = new Set([...state.ownerships.filter((item) => sources.has(item.scope.accountId)).map((item) => item.ownerActorId), ...state.memberships.filter((item) => sources.has(item.scope.accountId)).map((item) => item.actorId), ...relations.flatMap((item) => [item.from, item.to]).filter((item) => item.kind === "actor").map((item) => item.id)]);
  return {
    nodes: [{ id: account.id, kind: "account", label: account.name }, ...offices.map((item) => ({ id: item.id, kind: "office" as const, label: item.officeName.en })), ...people.map((item) => ({ id: item.person.id, kind: "contact" as const, label: item.person.name })), ...state.actors.filter((item) => actorIds.has(item.id)).map((item) => ({ id: item.id, kind: "actor" as const, label: item.displayName.en })), ...(account.groupId ? state.groups.filter((item) => item.id === account.groupId).map((item) => ({ id: item.id, kind: "group" as const, label: item.name })) : [])],
    edges: [...offices.map((item) => ({ id: `office-${item.id}`, from: account.id, to: item.id, type: "has_office" })), ...people.map((item) => ({ id: item.affiliation.id, from: item.affiliation.officeId ?? account.id, to: item.person.id, type: "affiliated" })), ...state.ownerships.filter((item) => sources.has(item.scope.accountId) && !item.endedAt).map((item) => ({ id: item.id, from: item.scope.officeId ?? account.id, to: item.ownerActorId, type: "primary_owner" })), ...state.memberships.filter((item) => sources.has(item.scope.accountId) && !item.endedAt).map((item) => ({ id: item.id, from: item.scope.officeId ?? account.id, to: item.actorId, type: "collaborator" })), ...relations.map((item) => ({ id: item.id, from: item.from.id, to: item.to.id, type: item.type })), ...(account.groupId ? [{ id: `group-${account.id}`, from: account.groupId, to: account.id, type: "brand" }] : [])],
  };
}
