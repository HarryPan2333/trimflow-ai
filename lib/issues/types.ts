import type { LocalizedText } from "../i18n";
import type { SourceRecordRef } from "../activity-memory/types";

export type IssueType = "color_deviation" | "dimension_deviation" | "performance_failure" | "material_issue" | "logo_issue" | "sample_mismatch" | "production_delay" | "shipment_delay" | "quantity_shortage" | "packaging_issue" | "documentation_issue" | "other";
export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "triaging" | "investigating" | "action_in_progress" | "waiting_customer" | "resolved" | "closed";
export type FactCertainty = "reported" | "suspected" | "confirmed";
export type RootCauseStatus = "unknown" | "suspected" | "confirmed";
export type ImpactDimension = "sample_rework" | "approval_delay" | "production_risk" | "shipment_risk" | "commercial_risk" | "relationship_risk";
export type ResolutionOutcome = "resolved" | "accepted_with_exception" | "replacement_sent" | "rework_completed" | "commercial_adjustment" | "cancelled";
export type CustomerOutcome = "pending" | "accepted" | "rejected" | "not_required";

export type IssueImpact = { dimensions: ImpactDimension[]; description: LocalizedText; certainty: FactCertainty };
export type IssueResolution = { outcome: ResolutionOutcome; whatDone: LocalizedText; customerOutcome: LocalizedText; customerOutcomeStatus: CustomerOutcome; internalLessons: LocalizedText; resolvedByActorId: string; resolvedAt: string; sourceRefs: SourceRecordRef[] };
export type Issue = {
  id: string; accountId: string; projectId?: number; sampleId?: string; sampleVersionId?: string; sampleFeedbackId?: string;
  orderId?: string; orderLineId?: string; productId?: string; variantId?: string; designRevisionId?: string;
  type: IssueType; severity: IssueSeverity; status: IssueStatus; title: LocalizedText; description: LocalizedText;
  customerSafeSummary?: LocalizedText;
  detectedAt: string; reportedAt?: string; reportedByActorId?: string; ownerActorId: string;
  customerImpact: IssueImpact; internalImpact?: IssueImpact; rootCauseStatus: RootCauseStatus; rootCauseSummary?: LocalizedText;
  factoryContext?: LocalizedText; resolution?: IssueResolution; createdAt: string; updatedAt: string; sourceRefs: SourceRecordRef[];
};
export type IssueAction = { id: string; issueId: string; type: "check" | "test" | "sample_revision" | "factory_follow_up" | "customer_update" | "replacement" | "other"; ownerActorId: string; description: LocalizedText; status: "open" | "completed"; dueAt?: string; completedAt?: string; linkedTaskId?: string; sourceRefs: SourceRecordRef[]; createdAt: string };
export type IssueCustomerResponse = { id: string; issueId: string; type: "acknowledged" | "corrective_plan" | "replacement_sample" | "revised_delivery" | "accepted_resolution" | "other"; content: LocalizedText; sentAt: string; actorId: string; sourceRefs: SourceRecordRef[]; acceptanceEvidence?: SourceRecordRef };
export type IssueEvent = { id: string; issueId: string; kind: "issue_reported" | "status_changed" | "root_cause_updated" | "action_completed" | "customer_response" | "customer_accepted" | "issue_resolved" | "issue_closed"; at: string; actorId?: string; summary: LocalizedText; sourceRefs: SourceRecordRef[]; relatedId?: string; fromStatus?: IssueStatus; toStatus?: IssueStatus; reportingRole: "activity" | "background" };
export type IssueSuggestion = { id: string; roomId: string; accountId: string; projectId?: number; sourceMessageIds: string[]; status: "suggested" | "reviewed" | "dismissed" | "applied"; suggestedAt: string; reviewedByActorId?: string; note?: LocalizedText };
export type ProductImprovementSuggestion = { id: string; issueId: string; productId: string; variantId?: string; proposal: LocalizedText; status: "pending" | "reviewed" | "dismissed"; sourceRefs: SourceRecordRef[]; createdAt: string; reviewedByActorId?: string };
export type ResolutionPlaybook = {
  id: string; sourceIssueIds: string[]; issueType: IssueType; applicableProductCategories: string[];
  title: LocalizedText; summary: LocalizedText; symptoms: LocalizedText[]; firstChecks: LocalizedText[];
  recommendedActions: LocalizedText[]; escalationGuidance: LocalizedText; testingGuidance: LocalizedText;
  customerCommunicationGuidance: LocalizedText; confirmedLessons: LocalizedText[]; suggestions: LocalizedText[];
  internalExpertActorIds: string[]; evidenceRefs: SourceRecordRef[];
  status: "draft" | "reviewed" | "published" | "archived"; createdAt: string; updatedAt: string;
  reviewedByActorId?: string; reviewedAt?: string; publishedByActorId?: string; publishedAt?: string;
};
export type IssueWorkspace = { issues: Issue[]; actions: IssueAction[]; responses: IssueCustomerResponse[]; events: IssueEvent[]; suggestions: IssueSuggestion[]; improvements: ProductImprovementSuggestion[]; playbooks: ResolutionPlaybook[] };
