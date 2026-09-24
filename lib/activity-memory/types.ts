import type { LocalizedText } from "../i18n";

export type BusinessTime = { kind: "instant"; value: string } | { kind: "date"; value: string } | { kind: "unknown" };
export type ActivityCategory = "customer_interaction" | "project_update" | "sample_update" | "commercial_update" | "task_update" | "relationship_update" | "order_update" | "internal_coordination";
export type EntityRef = { kind: "account" | "project" | "sample" | "sample_version" | "quotation" | "order" | "task" | "contact" | "product"; id: string };
export type SourceRecordRef = { provider: "trimflow" | "feishu" | "email" | "calendar"; recordType: string; recordId: string; recordVersion?: string };
export type EvidenceReference = SourceRecordRef & { id: string; supportedFactIds: string[]; role: "primary" | "supporting" | "lineage" | "conflicting"; capturedAt: string; sourceTimePrecision: BusinessTime["kind"]; target?: EntityRef; excerpt?: LocalizedText };
export type ActorAttribution = { performedByActorId?: string; recordedByActorId?: string; participantActorIds: string[]; reviewedByActorId?: string; appliedByActorId?: string; ownerAtOccurrence?: string; customerContactIds?: string[] };
export type ActivityFact =
  | { id: string; kind: "interaction"; channel: string; detail: LocalizedText }
  | { id: string; kind: "project_status"; stage: string; detail: LocalizedText }
  | { id: string; kind: "sample_version"; sampleId: string; versionId: string; action: "created" | "sent" | "approved" }
  | { id: string; kind: "sample_feedback"; sampleId: string; versionId: string; feedbackId: string; resolution: "open" | "resolved" }
  | { id: string; kind: "price_signal"; signalId: string; currency: string; unitPrice: number; quantity: number; unit: string; role: "customer_target" }
  | { id: string; kind: "quotation"; quotationId: string; currency: string; unitPrice: number; quantity: number; action: "created" | "sent" | "accepted" | "revised" }
  | { id: string; kind: "task_status"; taskId: string; fromStatus?: string; toStatus: string; action: "created" | "completed" | "reopened" }
  | { id: string; kind: "relationship"; contactId: string; action: "discovered" | "introduced" | "added" }
  | { id: string; kind: "order_milestone"; orderId: string; action: "po_received" | "contract_confirmed" | "milestone_completed" | "shipment_departed"; milestoneId?: string }
  | { id: string; kind: "requirement"; requirementId: string; confirmation: "pending" | "confirmed" }
  | { id: string; kind: "issue_event"; issueId: string; eventId: string; action: "issue_reported" | "action_completed" | "customer_accepted" | "issue_resolved" };

export type ActivityMemoryItem = {
  id: string; logicalEventId: string; revision: number; workspaceId: "demo";
  accountId?: string; projectId?: number; entities: EntityRef[];
  category: ActivityCategory; subtype: string; occurred: BusinessTime; sourceRecordedAt?: string; capturedAt: string;
  attribution: ActorAttribution; summary: LocalizedText; facts: ActivityFact[]; evidence: EvidenceReference[];
  causalGroupId?: string; causedByEventId?: string; status: "active" | "superseded" | "voided";
  supersedesId?: string; correctionReason?: string; visibility: "demo_shared"; sourceFingerprint: string;
  reportingRole: "activity" | "background" | "governance"; importanceReason?: string; manual?: boolean;
};

export type BusinessChangeReceipt = { id: string; commandId: string; entity: EntityRef; action: string; occurredAt: string; performedByActorId?: string; accountId?: string; projectId?: number; fromStatus?: string; toStatus?: string; sourceRefs: SourceRecordRef[] };
export type ManualActivityEntry = { id: string; authorActorId: string; performedByActorId?: string; occurred: BusinessTime; accountId?: string; projectId?: number; category: ActivityCategory; description: string; participantActorIds: string[]; sourceRefs: SourceRecordRef[]; recordedAt: string };
export type ActivityMemoryState = { items: ActivityMemoryItem[]; manualEntries: ManualActivityEntry[] };
