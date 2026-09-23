import type { AccountState } from "../accounts/types";
import { resolveCanonicalAccountId } from "../accounts/selectors";
import type { Project } from "../mock-data";
import type { SampleWorkspace } from "../../components/samples/sample-data";
import type { BusinessExtractionProposal, DealRoom, DealRoomMessage, DealRoomState } from "./types";

export function validateRoomScope(room: DealRoom, accounts: AccountState, projects: Project[]) {
  const account = accounts.accounts.find((item) => item.id === room.accountId);
  if (!account || account.recordStatus !== "canonical") throw new Error("Room needs a canonical Account");
  if (room.projectId !== undefined) {
    const project = projects.find((item) => item.id === room.projectId);
    if (!project || resolveCanonicalAccountId(accounts, project.clientId) !== room.accountId) throw new Error("Room Project does not belong to Account");
  }
  if (!room.participantActorIds.length || new Set(room.participantActorIds).size !== room.participantActorIds.length) throw new Error("Room participants are invalid");
  if (room.participantActorIds.some((id) => !accounts.actors.some((actor) => actor.id === id && actor.active))) throw new Error("Unknown Room participant");
}

export function validateMessage(message: DealRoomMessage, state: DealRoomState, accounts: AccountState) {
  const room = state.rooms.find((item) => item.id === message.roomId);
  if (!room || room.status !== "active") throw new Error("Room unavailable");
  if (!room.participantActorIds.includes(message.authorActorId) || !accounts.actors.some((item) => item.id === message.authorActorId && item.active)) throw new Error("Author must be a Room participant");
  if (!message.content.zh.trim() || !message.content.en.trim()) throw new Error("Message content required");
  if (message.replyToMessageId && !state.messages.some((item) => item.id === message.replyToMessageId && item.roomId === room.id)) throw new Error("Reply target not in Room");
  if (message.attachmentIds?.some((id) => !state.attachments.some((item) => item.id === id && item.roomId === room.id))) throw new Error("Attachment not in Room");
}

export function validateProposalEvidence(proposal: BusinessExtractionProposal, state: DealRoomState) {
  const room = state.rooms.find((item) => item.id === proposal.roomId);
  if (!room || !proposal.sourceMessageIds.length || new Set(proposal.sourceMessageIds).size !== proposal.sourceMessageIds.length) throw new Error("Proposal needs Room and source messages");
  if (proposal.sourceMessageIds.some((id) => !state.messages.some((item) => item.id === id && item.roomId === room.id))) throw new Error("Proposal evidence must come from its Room");
  if (proposal.proposalType === "customer_update" || proposal.proposalType === "meeting_summary" || proposal.proposalType === "contact_update" || proposal.proposalType === "relationship_update") {
    if (proposal.target.accountId !== room.accountId) throw new Error("Proposal Account target differs from Room");
  } else if (proposal.proposalType === "requirement_update" || proposal.proposalType === "target_price" || proposal.proposalType === "next_action") {
    if (proposal.target.projectId !== room.projectId) throw new Error("Proposal Project target differs from Room");
  } else if (proposal.proposalType === "sample_feedback" && room.projectId === undefined) throw new Error("Sample feedback needs Project scope");
}

export function validateProposalTarget(proposal: BusinessExtractionProposal, state: DealRoomState, accounts: AccountState, projects: Project[], samples: SampleWorkspace) {
  validateProposalEvidence(proposal, state);
  const room = state.rooms.find((item) => item.id === proposal.roomId)!;
  validateRoomScope(room, accounts, projects);
  switch (proposal.proposalType) {
    case "customer_update": if (!proposal.extractedFields.summary.trim()) throw new Error("Customer update is empty"); break;
    case "requirement_update":
      { const f = proposal.extractedFields;
      if (!f.value.trim() || !projects.some((item) => item.id === room.projectId)) throw new Error("Requirement update is incomplete");
      break; }
    case "sample_feedback": {
      const f = proposal.extractedFields;
      const sample = samples.samples.find((item) => item.id === f.sampleId && item.projectId === room.projectId && item.clientId === room.accountId);
      if (!sample || proposal.target.sampleId !== sample.id || proposal.target.sampleVersionId !== f.sampleVersionId || !samples.versions.some((item) => item.id === f.sampleVersionId && item.sampleId === sample.id)) throw new Error("Sample must be targeted by stable ID");
      if (f.resolvedInVersionId && !samples.versions.some((item) => item.id === f.resolvedInVersionId && item.sampleId === sample.id)) throw new Error("Resolution version must belong to sample");
      if (!f.summary.trim() || !f.requestedChange.trim()) throw new Error("Feedback needs summary and change");
      break;
    }
    case "target_price": { const f = proposal.extractedFields; if (!(f.unitPrice > 0) || !(f.quantity > 0) || !f.context.trim()) throw new Error("Target price facts are incomplete"); break; }
    case "next_action": { const f = proposal.extractedFields; if (!f.title.trim()) throw new Error("Task title required"); if (f.ownerActorId && !accounts.actors.some((item) => item.id === f.ownerActorId && item.active)) throw new Error("Task owner unavailable"); break; }
    case "contact_update": { const f = proposal.extractedFields; if (!f.name.trim() || !f.jobTitle.trim() || accounts.people.some((item) => item.id === f.contactId)) throw new Error("Contact needs a new stable ID and details"); break; }
    case "relationship_update": {
      const f = proposal.extractedFields;
      if (!accounts.people.some((item) => item.id === f.introducerContactId) || !accounts.people.some((item) => item.id === f.introducedContactId) || !accounts.actors.some((item) => item.id === f.recipientActorId)) throw new Error("Referral parties must exist; apply Contact first if needed");
      if (!accounts.affiliations.some((item) => item.accountId === room.accountId && item.contactId === f.introducedContactId)) throw new Error("Introduced contact must belong to Account");
      break;
    }
    case "meeting_summary": if (!proposal.extractedFields.keyUpdates.trim()) throw new Error("Meeting summary needs key updates"); break;
  }
}
