import type { AccountState } from "../accounts/types";
import { getAccountSourceIds, getAccountTeam } from "../accounts/selectors";
import type { DealRoomState } from "./types";

export function getAccountRooms(state: DealRoomState, accounts: AccountState, accountId: string) {
  const ids = new Set(getAccountSourceIds(accounts, accountId));
  return state.rooms.filter((room) => ids.has(room.accountId) && room.status === "active").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function getProjectRoom(state: DealRoomState, projectId: number) {
  return state.rooms.find((room) => room.projectId === projectId && room.status === "active");
}
export function getRoomMessages(state: DealRoomState, roomId: string) {
  return state.messages.filter((item) => item.roomId === roomId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export function getRoomProposals(state: DealRoomState, roomId: string) {
  return state.proposals.filter((item) => item.roomId === roomId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function getPendingProposalCount(state: DealRoomState, roomId: string) {
  return getRoomProposals(state, roomId).filter((item) => item.status === "suggested" || item.status === "reviewed").length;
}
export function suggestRoomParticipants(accounts: AccountState, accountId: string, projectOwnerActorId?: string) {
  const team = getAccountTeam(accounts, accountId);
  return [...new Set([team.owner?.ownerActorId, projectOwnerActorId, ...team.members.map((item) => item.actorId)].filter((id): id is string => Boolean(id)))];
}
