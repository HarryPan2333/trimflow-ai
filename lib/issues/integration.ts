import type { Issue, IssueCustomerResponse, IssueWorkspace } from "./types";

// A customer-facing view must be opted into explicitly: no factory, owner, blame,
// commercial concern, internal root cause or private resolution lesson crosses it.
export type CustomerSafeIssue = Pick<Issue, "id"> & {
  publicStatus: "under_review" | "corrective_action" | "resolved";
  customerSafeSummary?: Issue["customerSafeSummary"];
  confirmedCustomerImpact?: Issue["customerImpact"]["description"];
  responses: Array<Pick<IssueCustomerResponse, "type" | "content" | "sentAt">>;
};
export function customerSafeIssue(state: IssueWorkspace, issueId: string): CustomerSafeIssue {
  const issue = state.issues.find((row) => row.id === issueId);
  if (!issue) throw new Error("issue_not_found");
  return {
    id: issue.id, customerSafeSummary: issue.customerSafeSummary,
    publicStatus: issue.status === "resolved" || issue.status === "closed" ? "resolved" : issue.status === "action_in_progress" ? "corrective_action" : "under_review",
    confirmedCustomerImpact: issue.customerImpact.certainty === "confirmed" ? issue.customerImpact.description : undefined,
    responses: state.responses.filter((row) => row.issueId === issueId).map((row) => ({ type: row.type, content: row.content, sentAt: row.sentAt })),
  };
}
