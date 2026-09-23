import type { AccountState } from "../accounts/types";
import type { Project } from "../mock-data";
import type { BusinessExtractionProposal, DealRoom, DealRoomMessage, DealRoomState, ProposalReviewEdits, ProposalTarget } from "./types";
import { validateMessage, validateProposalEvidence, validateRoomScope } from "./validation";

export function createRoom(state: DealRoomState, room: DealRoom, accounts: AccountState, projects: Project[]) {
  validateRoomScope(room, accounts, projects);
  if (state.rooms.some((item) => item.id === room.id)) throw new Error("Room ID exists");
  if (state.rooms.some((item) => item.status === "active" && item.accountId === room.accountId && item.projectId === room.projectId)) throw new Error("A Room already exists for this business scope");
  return { ...state, rooms: [...state.rooms, room] };
}
export function addMessage(state: DealRoomState, message: DealRoomMessage, accounts: AccountState) {
  if (state.messages.some((item) => item.id === message.id)) return state;
  validateMessage(message, state, accounts);
  return { ...state, messages: [...state.messages, message], rooms: state.rooms.map((room) => room.id === message.roomId ? { ...room, updatedAt: message.createdAt } : room) };
}
export function addProposals(state: DealRoomState, proposals: BusinessExtractionProposal[]) {
  for (const proposal of proposals) validateProposalEvidence(proposal, state);
  return { ...state, proposals: [...state.proposals, ...proposals.filter((item) => !state.proposals.some((existing) => existing.id === item.id))] };
}
export function reviewProposal(state: DealRoomState, proposalId: string, reviewerActorId: string, reviewedAt: string, edits: ProposalReviewEdits) {
  const existing = state.proposals.find((item) => item.id === proposalId);
  if (!existing || !["suggested", "reviewed"].includes(existing.status)) throw new Error("Suggestion cannot be reviewed");
  if (!state.rooms.find((room) => room.id === existing.roomId)?.participantActorIds.includes(reviewerActorId)) throw new Error("Reviewer must be a Room participant");
  const next = structuredClone(state);
  const proposal = next.proposals.find((item) => item.id === proposalId)!;
  switch (proposal.proposalType) {
    case "customer_update": if (edits.summary !== undefined) proposal.extractedFields.summary = edits.summary.trim(); break;
    case "requirement_update": if (edits.value !== undefined) proposal.extractedFields.value = edits.value.trim(); if (edits.note !== undefined) proposal.extractedFields.note = edits.note.trim(); break;
    case "sample_feedback": if (edits.summary !== undefined) proposal.extractedFields.summary = edits.summary.trim(); if (edits.requestedChange !== undefined) proposal.extractedFields.requestedChange = edits.requestedChange.trim(); break;
    case "target_price": if (edits.unitPrice !== undefined) proposal.extractedFields.unitPrice = edits.unitPrice; if (edits.quantity !== undefined) proposal.extractedFields.quantity = edits.quantity; if (edits.context !== undefined) proposal.extractedFields.context = edits.context.trim(); break;
    case "next_action": if (edits.title !== undefined) proposal.extractedFields.title = edits.title.trim(); if (edits.dueDate !== undefined) proposal.extractedFields.dueDate = edits.dueDate; if (edits.ownerActorId !== undefined) proposal.extractedFields.ownerActorId = edits.ownerActorId; break;
    case "contact_update": if (edits.name !== undefined) proposal.extractedFields.name = edits.name.trim(); if (edits.jobTitle !== undefined) proposal.extractedFields.jobTitle = edits.jobTitle.trim(); break;
    case "relationship_update": break;
    case "meeting_summary": for (const key of ["keyUpdates", "customerRequirements", "commercialSignals", "sampleChanges", "nextActions", "openQuestions"] as const) if (edits[key] !== undefined) proposal.extractedFields[key] = edits[key].trim(); break;
  }
  proposal.status = "reviewed"; proposal.reviewedByActorId = reviewerActorId; proposal.reviewedAt = reviewedAt;
  return next;
}
export function dismissProposal(state: DealRoomState, proposalId: string, actorId: string, at: string, reason?: string) {
  const proposal = state.proposals.find((item) => item.id === proposalId);
  if (!proposal || proposal.status === "applied" || proposal.status === "dismissed") throw new Error("Suggestion cannot be dismissed");
  if (!state.rooms.find((room) => room.id === proposal.roomId)?.participantActorIds.includes(actorId)) throw new Error("Reviewer must be a Room participant");
  return { ...state, proposals: state.proposals.map((item) => item.id === proposalId ? { ...item, status: "dismissed" as const, dismissedByActorId: actorId, dismissedAt: at, dismissReason: reason } : item) };
}
export function markProposalApplied(state: DealRoomState, proposalId: string, actorId: string, at: string, target: ProposalTarget, resultSummary: { zh: string; en: string }) {
  return { ...state, proposals: state.proposals.map((item) => item.id === proposalId ? { ...item, status: "applied" as const, appliedAt: at, appliedByActorId: actorId, appliedTarget: target, resultSummary } : item) };
}
