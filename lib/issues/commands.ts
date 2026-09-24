import type { LocalizedText } from "../i18n";
import type { SourceRecordRef } from "../activity-memory/types";
import type { DealRoomState } from "../deal-room/types";
import type { Issue, IssueAction, IssueCustomerResponse, IssueResolution, IssueStatus, IssueSuggestion, IssueWorkspace, ProductImprovementSuggestion, RootCauseStatus } from "./types";
import { sourceRefExists, validateIssue, type IssueReferenceContext } from "./validation";

const transitions: Record<IssueStatus, IssueStatus[]> = {
  open: ["triaging", "investigating", "action_in_progress", "waiting_customer", "resolved"],
  triaging: ["investigating", "action_in_progress", "waiting_customer", "resolved"],
  investigating: ["action_in_progress", "waiting_customer", "resolved"],
  action_in_progress: ["investigating", "waiting_customer", "resolved"],
  waiting_customer: ["investigating", "action_in_progress", "resolved"],
  resolved: ["closed", "investigating"], closed: [],
};
const find = (state: IssueWorkspace, id: string) => { const issue = state.issues.find((row) => row.id === id); if (!issue) throw new Error("issue_not_found"); return issue; };
const event = (id: string, issueId: string, kind: IssueWorkspace["events"][number]["kind"], at: string, actorId: string | undefined, summary: LocalizedText, sourceRefs: SourceRecordRef[], reportingRole: "activity" | "background" = "background") => ({ id, issueId, kind, at, actorId, summary, sourceRefs, reportingRole });
export function createIssue(state: IssueWorkspace, issue: Issue, context: IssueReferenceContext): IssueWorkspace {
  if (state.issues.some((row) => row.id === issue.id)) throw new Error("duplicate_issue");
  const errors = validateIssue(issue, context);
  if (errors.length) throw new Error(errors.join(","));
  if (issue.sourceRefs.some((ref) => !sourceRefExists(ref, context))) throw new Error("source_not_found");
  if (issue.status !== "open") throw new Error("new_issue_must_be_open");
  // A linked order/sample proves the record exists, not that the new manual claim is verified.
  return { ...state, issues: [...state.issues, issue], events: [...state.events, event(`ie-${issue.id}-created`, issue.id, "issue_reported", issue.reportedAt ?? issue.detectedAt, issue.reportedByActorId, issue.description, issue.sourceRefs, "background")] };
}
export function transitionIssue(state: IssueWorkspace, id: string, status: IssueStatus, at: string, actorId: string): IssueWorkspace {
  const issue = find(state, id);
  if (!transitions[issue.status].includes(status)) throw new Error("invalid_status_transition");
  if (status === "resolved") throw new Error("resolution_required");
  return { ...state, issues: state.issues.map((row) => row.id === id ? { ...row, status, updatedAt: at, resolution: status === "investigating" ? undefined : row.resolution } : row), events: [...state.events, { ...event(`ie-${id}-${crypto.randomUUID()}`, id, status === "closed" ? "issue_closed" : "status_changed", at, actorId, { zh: `状态更新为 ${status}`, en: `Status changed to ${status}` }, [], "background"), fromStatus: issue.status, toStatus: status }] };
}
export function updateRootCause(state: IssueWorkspace, id: string, status: RootCauseStatus, summary: LocalizedText | undefined, at: string, actorId: string, sourceRefs: SourceRecordRef[]): IssueWorkspace {
  find(state, id);
  if (status !== "unknown" && !summary?.zh.trim()) throw new Error("cause_summary_required");
  if (status === "confirmed" && sourceRefs.length === 0) throw new Error("confirmed_cause_requires_evidence");
  return { ...state, issues: state.issues.map((row) => row.id === id ? { ...row, rootCauseStatus: status, rootCauseSummary: status === "unknown" ? undefined : summary, updatedAt: at } : row), events: [...state.events, event(`ie-${id}-${crypto.randomUUID()}`, id, "root_cause_updated", at, actorId, summary ?? { zh: "根因尚未确认", en: "Root cause remains unknown" }, sourceRefs)] };
}
export function addIssueAction(state: IssueWorkspace, action: IssueAction): IssueWorkspace {
  find(state, action.issueId);
  if (state.actions.some((row) => row.id === action.id)) throw new Error("duplicate_action");
  return { ...state, actions: [...state.actions, action] };
}
export function completeIssueAction(state: IssueWorkspace, id: string, at: string, actorId: string, evidence: SourceRecordRef[] = []): IssueWorkspace {
  const action = state.actions.find((row) => row.id === id);
  if (!action || action.status !== "open") throw new Error("action_not_open");
  const refs = [...action.sourceRefs, ...evidence];
  return { ...state, actions: state.actions.map((row) => row.id === id ? { ...row, status: "completed", completedAt: at, sourceRefs: refs } : row), events: [...state.events, event(`ie-${id}-completed`, action.issueId, "action_completed", at, actorId, action.description, refs, evidence.length ? "activity" : "background")] };
}
export function recordCustomerResponse(state: IssueWorkspace, response: IssueCustomerResponse): IssueWorkspace {
  find(state, response.issueId);
  if (response.type === "accepted_resolution" && !response.acceptanceEvidence) throw new Error("acceptance_evidence_required");
  if (state.responses.some((row) => row.id === response.id)) throw new Error("duplicate_response");
  const refs = [...response.sourceRefs, ...(response.acceptanceEvidence ? [response.acceptanceEvidence] : [])];
  return { ...state, responses: [...state.responses, response], events: [...state.events, { ...event(`ie-${response.id}`, response.issueId, response.type === "accepted_resolution" ? "customer_accepted" : "customer_response", response.sentAt, response.actorId, response.content, refs, refs.length ? "activity" : "background"), relatedId: response.id }] };
}
export function resolveIssue(state: IssueWorkspace, id: string, resolution: IssueResolution): IssueWorkspace {
  const issue = find(state, id);
  if (issue.status === "resolved" || issue.status === "closed") throw new Error("already_resolved");
  if (!resolution.whatDone.zh.trim() || !resolution.internalLessons.zh.trim() || !resolution.resolvedByActorId) throw new Error("resolution_fields_required");
  if (resolution.customerOutcomeStatus === "accepted" && !state.responses.some((row) => row.issueId === id && row.type === "accepted_resolution" && row.acceptanceEvidence)) throw new Error("customer_acceptance_not_evidenced");
  return { ...state, issues: state.issues.map((row) => row.id === id ? { ...row, status: "resolved", resolution, updatedAt: resolution.resolvedAt } : row), events: [...state.events, event(`ie-${id}-resolved-${crypto.randomUUID()}`, id, "issue_resolved", resolution.resolvedAt, resolution.resolvedByActorId, resolution.whatDone, resolution.sourceRefs, resolution.sourceRefs.length ? "activity" : "background")] };
}
export function addIssueSuggestion(state: IssueWorkspace, suggestion: IssueSuggestion, dealRoom: DealRoomState): IssueWorkspace {
  if (suggestion.sourceMessageIds.length === 0 || state.suggestions.some((row) => row.id === suggestion.id)) throw new Error("invalid_suggestion");
  const room = dealRoom.rooms.find((row) => row.id === suggestion.roomId);
  if (!room || room.accountId !== suggestion.accountId || room.projectId !== suggestion.projectId || suggestion.sourceMessageIds.some((id) => !dealRoom.messages.some((message) => message.id === id && message.roomId === room.id))) throw new Error("suggestion_source_mismatch");
  return { ...state, suggestions: [...state.suggestions, suggestion] };
}
export function reviewIssueSuggestion(state: IssueWorkspace, id: string, actorId: string, decision: "reviewed" | "dismissed"): IssueWorkspace {
  if (!state.suggestions.some((row) => row.id === id && row.status === "suggested")) throw new Error("suggestion_not_open");
  return { ...state, suggestions: state.suggestions.map((row) => row.id === id ? { ...row, status: decision, reviewedByActorId: actorId } : row) };
}
export function applyIssueSuggestion(state: IssueWorkspace, id: string, issueId: string): IssueWorkspace {
  const suggestion = state.suggestions.find((row) => row.id === id);
  const issue = state.issues.find((row) => row.id === issueId);
  if (!suggestion || suggestion.status !== "reviewed" || !issue || issue.accountId !== suggestion.accountId || issue.projectId !== suggestion.projectId || suggestion.sourceMessageIds.some((messageId) => !issue.sourceRefs.some((ref) => ref.recordType === "deal_message" && ref.recordId === messageId))) throw new Error("suggestion_issue_mismatch");
  return { ...state, suggestions: state.suggestions.map((row) => row.id === id ? { ...row, status: "applied" } : row) };
}
export function addProductImprovement(state: IssueWorkspace, improvement: ProductImprovementSuggestion): IssueWorkspace {
  const issue = find(state, improvement.issueId);
  if (issue.status !== "resolved" || issue.productId !== improvement.productId) throw new Error("product_improvement_scope_mismatch");
  return { ...state, improvements: [...state.improvements, improvement] };
}
export function reviewProductImprovement(state: IssueWorkspace, id: string, actorId: string, decision: "reviewed" | "dismissed"): IssueWorkspace {
  const improvement = state.improvements.find((row) => row.id === id);
  if (!improvement || improvement.status !== "pending") throw new Error("improvement_not_pending");
  return { ...state, improvements: state.improvements.map((row) => row.id === id ? { ...row, status: decision, reviewedByActorId: actorId } : row) };
}
