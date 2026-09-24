import type { Issue, IssueEvent, IssueWorkspace } from "./types";
import type { IssueReferenceContext } from "./validation";
import type { LocalizedText } from "../i18n";
import type { SourceRecordRef } from "../activity-memory/types";

export const isActiveIssue = (issue: Issue) => issue.status !== "resolved" && issue.status !== "closed";
export const issuesForAccount = (state: IssueWorkspace, accountId: string) => state.issues.filter((issue) => issue.accountId === accountId);
export const issuesForProject = (state: IssueWorkspace, projectId: number) => state.issues.filter((issue) => issue.projectId === projectId);
export const issuesForSample = (state: IssueWorkspace, sampleId: string) => state.issues.filter((issue) => issue.sampleId === sampleId);
export const issuesForOrder = (state: IssueWorkspace, orderId: string) => state.issues.filter((issue) => issue.orderId === orderId);
export function issueTimeline(state: IssueWorkspace, issueId: string): IssueEvent[] {
  return state.events.filter((event) => event.issueId === issueId).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}
export type IssueTimelineEntry = { id: string; at: string; kind: string; summary: LocalizedText; sourceRefs: SourceRecordRef[]; verified: boolean };
export function projectIssueTimeline(state: IssueWorkspace, issueId: string, context: IssueReferenceContext): IssueTimelineEntry[] {
  const issue = state.issues.find((row) => row.id === issueId);
  if (!issue) return [];
  const recorded = issueTimeline(state, issueId);
  const represented = new Set(recorded.flatMap((event) => event.sourceRefs.map((ref) => `${ref.recordType}:${ref.recordId}`)));
  const extra = issue.sourceRefs.flatMap((ref): IssueTimelineEntry[] => {
    if (represented.has(`${ref.recordType}:${ref.recordId}`)) return [];
    if (ref.recordType === "sample_version") {
      const version = context.samples.versions.find((row) => row.id === ref.recordId);
      return version ? [{ id: `source:${ref.recordId}`, at: version.createdAt, kind: "sample_version", summary: { zh: version.summary, en: version.summary }, sourceRefs: [ref], verified: true }] : [];
    }
    if (ref.recordType === "sample_feedback") {
      const feedback = context.samples.feedback.find((row) => row.id === ref.recordId);
      return feedback ? [{ id: `source:${ref.recordId}`, at: feedback.receivedAt, kind: "sample_feedback", summary: { zh: feedback.summary, en: feedback.summary }, sourceRefs: [ref], verified: true }] : [];
    }
    if (ref.recordType === "deal_message") {
      const message = context.dealRoom?.messages.find((row) => row.id === ref.recordId);
      return message ? [{ id: `source:${ref.recordId}`, at: message.createdAt, kind: "deal_message", summary: message.content, sourceRefs: [ref], verified: false }] : [];
    }
    return [];
  });
  return [...recorded.map((event) => ({ id: event.id, at: event.at, kind: event.kind, summary: event.summary, sourceRefs: event.sourceRefs, verified: event.sourceRefs.length > 0 })), ...extra]
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}
export function nextIssueAction(state: IssueWorkspace, issueId: string) {
  return state.actions.find((action) => action.issueId === issueId && action.status === "open");
}
