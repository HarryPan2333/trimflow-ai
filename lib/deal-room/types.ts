import type { LocalizedText } from "../i18n";
import type { Requirement, Task } from "../mock-data";

export type DealRoom = {
  id: string;
  accountId: string;
  projectId?: number;
  title: LocalizedText;
  status: "active" | "archived";
  participantActorIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type DealRoomMessageKind = "text" | "customer_update" | "meeting_note" | "sample_feedback" | "internal_note" | "system_event";
export type BusinessContextRef = { kind: "account" | "project" | "sample" | "sample_version" | "quotation"; id: string };
export type DealRoomMessage = {
  id: string;
  roomId: string;
  authorActorId: string;
  createdAt: string;
  kind: DealRoomMessageKind;
  content: LocalizedText;
  attachmentIds?: string[];
  replyToMessageId?: string;
  businessContextRefs?: BusinessContextRef[];
};
export type DealRoomAttachment = {
  id: string;
  roomId: string;
  kind: "image" | "document" | "sample_photo" | "technical_drawing" | "meeting_note";
  title: LocalizedText;
  assetPath: `/deal-room/${string}`;
  createdAt: string;
};

export type ProposalType = "customer_update" | "requirement_update" | "sample_feedback" | "target_price" | "next_action" | "contact_update" | "relationship_update" | "meeting_summary";
export type ProposalStatus = "suggested" | "reviewed" | "applied" | "dismissed";
export type ProposalTarget = { kind: "account_activity" | "project_requirement" | "sample_feedback" | "commercial_signal" | "task" | "contact" | "referral"; id: string };
type ProposalBase = {
  id: string;
  roomId: string;
  sourceMessageIds: string[];
  confidenceState: "clear" | "needs_review" | "ambiguous";
  createdAt: string;
  status: ProposalStatus;
  reviewedAt?: string;
  reviewedByActorId?: string;
  appliedAt?: string;
  appliedByActorId?: string;
  appliedTarget?: ProposalTarget;
  resultSummary?: LocalizedText;
  dismissedAt?: string;
  dismissedByActorId?: string;
  dismissReason?: string;
};

export type BusinessExtractionProposal = ProposalBase & (
  | { proposalType: "customer_update"; extractedFields: { summary: string } ; target: { kind: "account_activity"; accountId: string } }
  | { proposalType: "requirement_update"; extractedFields: { requirementId: string; value: string; note: string } ; target: { kind: "project_requirement"; projectId: number } }
  | { proposalType: "sample_feedback"; extractedFields: { sampleId: string; sampleVersionId: string; summary: string; requestedChange: string; resolvedInVersionId?: string } ; target: { kind: "sample_feedback"; sampleId: string; sampleVersionId: string } }
  | { proposalType: "target_price"; extractedFields: { currency: "USD" | "EUR" | "CNY"; unitPrice: number; quantity: number; unit: string; context: string } ; target: { kind: "commercial_signal"; projectId: number } }
  | { proposalType: "next_action"; extractedFields: { title: string; ownerActorId?: string; dueDate?: string } ; target: { kind: "task"; projectId: number } }
  | { proposalType: "contact_update"; extractedFields: { contactId: string; name: string; jobTitle: string; functionTag: "sourcing" | "product_development" | "design" | "technical" } ; target: { kind: "contact"; accountId: string } }
  | { proposalType: "relationship_update"; extractedFields: { introducerContactId: string; introducedContactId: string; recipientActorId: string } ; target: { kind: "referral"; accountId: string } }
  | { proposalType: "meeting_summary"; extractedFields: { keyUpdates: string; customerRequirements: string; commercialSignals: string; sampleChanges: string; nextActions: string; openQuestions: string } ; target: { kind: "account_activity"; accountId: string } }
);

export type DealRoomTask = Task & { accountId: string; sourceProposalId: string; sourceMessageIds: string[]; ownerActorId?: string };
export type DealRequirementUpdate = Requirement & { sourceProposalId: string; sourceMessageIds: string[] };
export type TargetPriceSignal = { id: string; accountId: string; projectId: number; currency: "USD" | "EUR" | "CNY"; unitPrice: number; quantity: number; unit: string; context: string; sourceProposalId: string; sourceMessageIds: string[]; recordedAt: string };
export type DealRoomState = {
  rooms: DealRoom[];
  messages: DealRoomMessage[];
  attachments: DealRoomAttachment[];
  proposals: BusinessExtractionProposal[];
  requirements: DealRequirementUpdate[];
  tasks: DealRoomTask[];
  targetPriceSignals: TargetPriceSignal[];
};

export type ProposalReviewEdits = {
  summary?: string;
  value?: string;
  note?: string;
  requestedChange?: string;
  unitPrice?: number;
  quantity?: number;
  context?: string;
  title?: string;
  dueDate?: string;
  ownerActorId?: string;
  name?: string;
  jobTitle?: string;
  keyUpdates?: string;
  customerRequirements?: string;
  commercialSignals?: string;
  sampleChanges?: string;
  nextActions?: string;
  openQuestions?: string;
};
