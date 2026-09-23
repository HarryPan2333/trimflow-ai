import { addActivity, addContact, addReferral } from "../accounts/commands";
import type { AccountState } from "../accounts/types";
import { projectRequirements, type Project, type SampleFeedback } from "../mock-data";
import type { SampleWorkspace } from "../../components/samples/sample-data";
import { markProposalApplied } from "./commands";
import type { DealRoomState } from "./types";
import { validateProposalTarget } from "./validation";

export type ApplyContext = { accounts: AccountState; projects: Project[]; samples: SampleWorkspace; actorId: string; at: string };
export function applyReviewedProposal(state: DealRoomState, proposalId: string, context: ApplyContext) {
  const proposal = state.proposals.find((item) => item.id === proposalId);
  if (!proposal) throw new Error("Suggestion not found");
  if (proposal.status === "applied") return { dealRoom: state, accounts: context.accounts, alreadyApplied: true as const };
  if (proposal.status !== "reviewed" || !proposal.reviewedByActorId) throw new Error("Human review is required before Apply");
  const room = state.rooms.find((item) => item.id === proposal.roomId)!;
  if (!room.participantActorIds.includes(context.actorId)) throw new Error("Apply actor must participate in Room");
  validateProposalTarget(proposal, state, context.accounts, context.projects, context.samples);
  let dealRoom = structuredClone(state);
  let accounts = context.accounts;
  let sampleFeedback: SampleFeedback | undefined;
  let targetId: string;
  switch (proposal.proposalType) {
    case "customer_update": {
      const f = proposal.extractedFields;
      targetId = `activity-${proposal.id}`;
      accounts = addActivity(accounts, { id: targetId, accountId: room.accountId, projectId: room.projectId, type: "customer_update", title: { zh: "客户动态（人工确认）", en: "Customer update (reviewed)" }, detail: { zh: f.summary, en: f.summary }, occurredAt: context.at, actorId: context.actorId });
      break;
    }
    case "requirement_update": {
      const f = proposal.extractedFields;
      const original = dealRoom.requirements.find((item) => item.id === f.requirementId) ?? projectRequirements.find((item) => item.id === f.requirementId && item.projectId === room.projectId);
      if (!original) throw new Error("Project Requirement ID not found");
      targetId = original.id;
      const update = { ...original, value: f.value, status: "待确认" as const, source: "内部记录" as const, updatedAt: context.at, sourceProposalId: proposal.id, sourceMessageIds: [...proposal.sourceMessageIds] };
      dealRoom.requirements = [...dealRoom.requirements.filter((item) => item.id !== targetId), update];
      break;
    }
    case "sample_feedback": {
      const f = proposal.extractedFields;
      targetId = `feedback-${proposal.id}`;
      if (context.samples.feedback.some((item) => item.id === targetId)) throw new Error("Feedback already recorded");
      sampleFeedback = { id: targetId, sampleId: f.sampleId, sampleVersionId: f.sampleVersionId, projectId: room.projectId!, receivedAt: state.messages.find((item) => item.id === proposal.sourceMessageIds[0])!.createdAt, author: "TrimFlow Demo Review", channel: "Meeting", summary: f.summary, details: f.requestedChange, requiresRevision: true, requiredAction: f.requestedChange, resolution: f.resolvedInVersionId ? "Resolved" : "Open", resolvedInVersionId: f.resolvedInVersionId };
      break;
    }
    case "target_price": {
      const f = proposal.extractedFields;
      targetId = `signal-${proposal.id}`;
      dealRoom.targetPriceSignals.push({ id: targetId, accountId: room.accountId, projectId: room.projectId!, ...f, sourceProposalId: proposal.id, sourceMessageIds: [...proposal.sourceMessageIds], recordedAt: context.at });
      break;
    }
    case "next_action": {
      const f = proposal.extractedFields;
      targetId = `task-${proposal.id}`;
      dealRoom.tasks.push({ id: targetId, accountId: room.accountId, projectId: room.projectId!, title: f.title, owner: context.accounts.actors.find((item) => item.id === f.ownerActorId)?.displayName.zh ?? "待分配", ownerActorId: f.ownerActorId, priority: "P2", dueDate: f.dueDate ?? "", status: "待处理", sourceProposalId: proposal.id, sourceMessageIds: [...proposal.sourceMessageIds] });
      break;
    }
    case "contact_update": {
      const f = proposal.extractedFields;
      targetId = f.contactId;
      accounts = addContact(accounts, { id: f.contactId, name: f.name, status: "active" }, { id: `affiliation-${proposal.id}`, contactId: f.contactId, accountId: room.accountId, jobTitle: f.jobTitle, functionTags: [f.functionTag] });
      break;
    }
    case "relationship_update": {
      const f = proposal.extractedFields;
      targetId = `referral-${proposal.id}`;
      accounts = addReferral(accounts, { id: targetId, introducer: { kind: "contact", id: f.introducerContactId }, introducedContactId: f.introducedContactId, recipient: { kind: "actor", id: f.recipientActorId }, accountId: room.accountId, projectId: room.projectId, introducedAt: context.at, recordedByActorId: context.actorId, recordedAt: context.at, sourceDetail: { zh: "来自内部协作讨论，人工确认", en: "Human-confirmed from team discussion" } }, { id: `event-${proposal.id}`, at: context.at, actorId: context.actorId });
      break;
    }
    case "meeting_summary": {
      const f = proposal.extractedFields;
      targetId = `activity-${proposal.id}`;
      const summary = Object.entries(f).filter(([, value]) => value.trim()).map(([key, value]) => `${key}: ${value}`).join("\n");
      accounts = addActivity(accounts, { id: targetId, accountId: room.accountId, projectId: room.projectId, type: "meeting", title: { zh: "会议摘要（人工确认）", en: "Meeting summary (reviewed)" }, detail: { zh: summary, en: summary }, occurredAt: context.at, actorId: context.actorId });
      break;
    }
  }
  const result = { zh: "已写入对应业务记录，原讨论和证据保留。", en: "Applied to the linked business record; original discussion and evidence remain." };
  dealRoom = markProposalApplied(dealRoom, proposal.id, context.actorId, context.at, { kind: proposal.target.kind, id: targetId }, result);
  return { dealRoom, accounts, sampleFeedback, alreadyApplied: false as const };
}
