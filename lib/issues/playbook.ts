import type { LocalizedText } from "../i18n";
import type { IssueWorkspace, ResolutionPlaybook } from "./types";

const both = (zh: string, en: string): LocalizedText => ({ zh, en });
const requirePlaybook = (state: IssueWorkspace, id: string) => { const playbook = state.playbooks.find((row) => row.id === id); if (!playbook) throw new Error("playbook_not_found"); return playbook; };
export function draftPlaybook(state: IssueWorkspace, issueId: string, at: string): IssueWorkspace {
  const issue = state.issues.find((row) => row.id === issueId);
  if (!issue || issue.status !== "resolved" || !issue.resolution) throw new Error("resolved_issue_required");
  if (state.playbooks.some((row) => row.sourceIssueIds.includes(issueId) && row.status !== "archived")) throw new Error("active_playbook_exists");
  const actions = state.actions.filter((row) => row.issueId === issueId && row.status === "completed");
  const refs = [...new Map([...issue.sourceRefs, ...issue.resolution.sourceRefs, ...actions.flatMap((row) => row.sourceRefs)].map((row) => [`${row.provider}:${row.recordType}:${row.recordId}`, row])).values()];
  const playbook: ResolutionPlaybook = {
    id: `PB-${issueId}`, sourceIssueIds: [issueId], issueType: issue.type, applicableProductCategories: [],
    title: both(`${issue.title.zh}｜处理经验`, `${issue.title.en} | Resolution notes`),
    summary: both(`本条仅基于 ${issue.id} 的模拟处理记录，供类似情况参考。`, `Internal demo guidance based only on synthetic case ${issue.id}.`),
    symptoms: [issue.description], firstChecks: [both("核对原始需求、样品或订单记录及客户反馈。", "Check original requirements, sample or order records, and customer feedback.")],
    recommendedActions: actions.length ? actions.map((row) => row.description) : [both("明确责任人与下一步核查动作。", "Assign an owner and a next verification step.")],
    escalationGuidance: both("如客户节点受影响，先人工评估并向负责人升级。", "If a customer milestone may be affected, assess and escalate to the owner."),
    testingGuidance: both("测试要求须以当前项目已确认标准为准；此案例不建立通用技术标准。", "Use only confirmed project testing standards; this case does not establish a universal technical rule."),
    customerCommunicationGuidance: both("仅对外提供已核实的事实、纠正方案和待确认事项。", "Share only verified facts, corrective steps, and open questions with the customer."),
    confirmedLessons: issue.rootCauseStatus === "confirmed" ? [issue.resolution.internalLessons] : [],
    suggestions: issue.rootCauseStatus === "confirmed" ? [] : [issue.resolution.internalLessons],
    internalExpertActorIds: [...new Set([issue.ownerActorId, issue.resolution.resolvedByActorId, ...actions.map((row) => row.ownerActorId)])],
    evidenceRefs: refs, status: "draft", createdAt: at, updatedAt: at,
  };
  return { ...state, playbooks: [...state.playbooks, playbook] };
}
export function editPlaybook(state: IssueWorkspace, id: string, changes: Partial<Pick<ResolutionPlaybook, "title" | "summary" | "symptoms" | "firstChecks" | "recommendedActions" | "escalationGuidance" | "testingGuidance" | "customerCommunicationGuidance" | "confirmedLessons" | "suggestions">>, at: string): IssueWorkspace {
  const playbook = requirePlaybook(state, id);
  if (playbook.status === "published" || playbook.status === "archived") throw new Error("playbook_not_editable");
  return { ...state, playbooks: state.playbooks.map((row) => row.id === id ? { ...row, ...changes, status: "draft", reviewedAt: undefined, reviewedByActorId: undefined, updatedAt: at } : row) };
}
export function reviewPlaybook(state: IssueWorkspace, id: string, actorId: string, at: string): IssueWorkspace {
  const playbook = requirePlaybook(state, id);
  if (playbook.status !== "draft") throw new Error("draft_required");
  if (!playbook.sourceIssueIds.every((sourceId) => state.issues.some((issue) => issue.id === sourceId && issue.status === "resolved"))) throw new Error("resolved_source_required");
  if (!playbook.sourceIssueIds.every((sourceId) => state.issues.some((issue) => issue.id === sourceId && Boolean(issue.resolution?.sourceRefs.length)))) throw new Error("resolution_evidence_required");
  if (!playbook.evidenceRefs.length) throw new Error("evidence_required");
  return { ...state, playbooks: state.playbooks.map((row) => row.id === id ? { ...row, status: "reviewed", reviewedByActorId: actorId, reviewedAt: at, updatedAt: at } : row) };
}
export function publishPlaybook(state: IssueWorkspace, id: string, actorId: string, at: string): IssueWorkspace {
  const playbook = requirePlaybook(state, id);
  if (playbook.status !== "reviewed" || !playbook.reviewedByActorId) throw new Error("human_review_required");
  if (!playbook.sourceIssueIds.every((sourceId) => state.issues.some((issue) => issue.id === sourceId && issue.status === "resolved" && Boolean(issue.resolution?.sourceRefs.length)))) throw new Error("resolved_source_required");
  return { ...state, playbooks: state.playbooks.map((row) => row.id === id ? { ...row, status: "published", publishedByActorId: actorId, publishedAt: at, updatedAt: at } : row) };
}
export function archivePlaybook(state: IssueWorkspace, id: string, at: string): IssueWorkspace {
  const playbook = requirePlaybook(state, id);
  if (playbook.status !== "published") throw new Error("published_required");
  return { ...state, playbooks: state.playbooks.map((row) => row.id === id ? { ...row, status: "archived", updatedAt: at } : row) };
}
