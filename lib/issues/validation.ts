import type { AccountState } from "../accounts/types";
import type { DealRoomState } from "../deal-room/types";
import type { Project } from "../mock-data/types";
import type { ProductLibraryData } from "../product-library/types";
import type { SampleWorkspace } from "../../components/samples/sample-data";
import type { OrderWorkspace } from "../../components/orders/order-data";
import type { SourceRecordRef } from "../activity-memory/types";
import type { Issue, IssueSeverity } from "./types";

export type IssueReferenceContext = { accounts: AccountState; projects: Project[]; samples: SampleWorkspace; orders: OrderWorkspace; products: ProductLibraryData; dealRoom?: DealRoomState };
export const severityMeaning: Record<IssueSeverity, { zh: string; en: string }> = {
  low: { zh: "影响有限，可按常规节奏处理", en: "Limited impact; routine handling" },
  medium: { zh: "需要纠正，当前仍可管理进度", en: "Correction needed; timeline remains manageable" },
  high: { zh: "客户或项目节点可能受影响", en: "Customer or project milestone may be at risk" },
  critical: { zh: "重大交付、商务或客户关系风险", en: "Major delivery, commercial, or relationship risk" },
};
const has = (value: string) => value.trim().length > 0;
export function validateIssue(issue: Issue, context: IssueReferenceContext): string[] {
  const errors: string[] = [];
  if (!context.accounts.accounts.some((row) => row.id === issue.accountId)) errors.push("account_not_found");
  const project = issue.projectId === undefined ? undefined : context.projects.find((row) => row.id === issue.projectId);
  if (issue.projectId !== undefined && !project) errors.push("project_not_found");
  if (project && project.clientId !== issue.accountId) errors.push("account_project_mismatch");
  const sample = issue.sampleId ? context.samples.samples.find((row) => row.id === issue.sampleId) : undefined;
  if (issue.sampleId && !sample) errors.push("sample_not_found");
  if (sample && (sample.clientId !== issue.accountId || (issue.projectId !== undefined && sample.projectId !== issue.projectId))) errors.push("sample_scope_mismatch");
  const version = issue.sampleVersionId ? context.samples.versions.find((row) => row.id === issue.sampleVersionId) : undefined;
  if (issue.sampleVersionId && (!version || version.sampleId !== issue.sampleId)) errors.push("sample_version_mismatch");
  const feedback = issue.sampleFeedbackId ? context.samples.feedback.find((row) => row.id === issue.sampleFeedbackId) : undefined;
  if (issue.sampleFeedbackId && (!feedback || feedback.sampleId !== issue.sampleId || (issue.sampleVersionId && feedback.sampleVersionId !== issue.sampleVersionId))) errors.push("sample_feedback_mismatch");
  const order = issue.orderId ? context.orders.orders.find((row) => row.id === issue.orderId) : undefined;
  if (issue.orderId && !order) errors.push("order_not_found");
  if (order && (order.clientId !== issue.accountId || (issue.projectId !== undefined && order.projectId !== issue.projectId))) errors.push("order_scope_mismatch");
  if (issue.orderLineId && !context.orders.lines.some((row) => row.id === issue.orderLineId && row.purchaseOrderId === issue.orderId)) errors.push("order_line_mismatch");
  if (issue.productId && !context.products.products.some((row) => row.id === issue.productId)) errors.push("product_not_found");
  if (issue.productId && issue.projectId !== undefined && !context.products.projectProducts.some((row) => row.projectId === issue.projectId && row.productId === issue.productId)) errors.push("product_project_mismatch");
  if (issue.variantId && !context.products.variants.some((row) => row.id === issue.variantId && row.productId === issue.productId)) errors.push("variant_mismatch");
  if (issue.designRevisionId && !context.products.revisions.some((row) => row.id === issue.designRevisionId && context.products.variants.some((variant) => variant.id === row.variantId && variant.productId === issue.productId))) errors.push("revision_mismatch");
  if (!Object.hasOwn(severityMeaning, issue.severity)) errors.push("invalid_severity");
  if (!has(issue.title.zh) || !has(issue.title.en) || !has(issue.description.zh) || !has(issue.description.en)) errors.push("content_required");
  if (!issue.ownerActorId) errors.push("owner_required");
  if (issue.rootCauseStatus === "unknown" && issue.rootCauseSummary) errors.push("unknown_cause_has_summary");
  if (issue.rootCauseStatus !== "unknown" && !issue.rootCauseSummary?.zh.trim()) errors.push("cause_summary_required");
  if (issue.status === "resolved" && !issue.resolution) errors.push("resolution_required");
  return errors;
}
export function sourceRefExists(ref: SourceRecordRef, context: IssueReferenceContext): boolean {
  if (ref.provider !== "trimflow") return false;
  switch (ref.recordType) {
    case "sample": return context.samples.samples.some((row) => row.id === ref.recordId);
    case "sample_version": return context.samples.versions.some((row) => row.id === ref.recordId);
    case "sample_feedback": return context.samples.feedback.some((row) => row.id === ref.recordId);
    case "purchase_order": return context.orders.orders.some((row) => row.id === ref.recordId);
    case "order_issue": return context.orders.orders.some((row) => row.issues?.some((issue) => issue.id === ref.recordId));
    case "order_line": return context.orders.lines.some((row) => row.id === ref.recordId);
    case "deal_message": return context.dealRoom?.messages.some((row) => row.id === ref.recordId) ?? false;
    case "product": return context.products.products.some((row) => row.id === ref.recordId);
    case "variant": return context.products.variants.some((row) => row.id === ref.recordId);
    default: return false;
  }
}
