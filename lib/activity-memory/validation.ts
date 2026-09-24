import { resolveCanonicalAccountId } from "../accounts/selectors";
import type { ActivityMemoryItem } from "./types";
import { sourceExists, type BusinessSources } from "./source-adapters";

export function validateMemoryItem(item: ActivityMemoryItem, sources: BusinessSources): string[] {
  const issues: string[] = [];
  if (!item.evidence.length || !item.evidence.some((ref) => ref.role === "primary")) issues.push("missing_primary_evidence");
  for (const ref of item.evidence) if (!sourceExists(sources, ref)) issues.push(`missing_source:${ref.recordType}:${ref.recordId}`);
  const primary = item.evidence.find((ref) => ref.role === "primary");
  if (primary && primary.recordVersion !== item.sourceFingerprint && !item.correctionReason) issues.push("source_revision_mismatch");
  if (item.projectId !== undefined) {
    const project = sources.projects.find((row) => row.id === item.projectId);
    if (!project) issues.push("unknown_project");
    else if (item.accountId) {
      try { if (resolveCanonicalAccountId(sources.accounts, project.clientId) !== resolveCanonicalAccountId(sources.accounts, item.accountId)) issues.push("account_project_mismatch"); }
      catch { issues.push("unknown_account"); }
    }
  }
  if (item.accountId && !sources.accounts.accounts.some((account) => account.id === item.accountId)) issues.push("unknown_account");
  if (item.attribution.performedByActorId && !sources.accounts.actors.some((actor) => actor.id === item.attribution.performedByActorId)) issues.push("unknown_performer");
  if (item.attribution.participantActorIds.some((id) => !sources.accounts.actors.some((actor) => actor.id === id))) issues.push("unknown_participant");
  for (const fact of item.facts) {
    if (!item.evidence.some((ref) => ref.role === "primary" && ref.supportedFactIds.includes(fact.id))) issues.push(`unsupported_fact:${fact.id}`);
    if (fact.kind === "quotation") {
      const quote = sources.quotations.find((row) => row.id === fact.quotationId);
      if (!quote || quote.projectId !== item.projectId || quote.currency !== fact.currency || quote.unitPrice !== fact.unitPrice || quote.quantity !== fact.quantity) issues.push("quotation_terms_mismatch");
      if (fact.action === "accepted" && quote?.status !== "Accepted") issues.push("quotation_not_accepted");
      if (quote?.status === "Draft") issues.push("draft_quotation");
    }
    if (fact.kind === "price_signal") {
      const signal = sources.dealRoom.targetPriceSignals.find((row) => row.id === fact.signalId);
      if (!signal || signal.projectId !== item.projectId || signal.currency !== fact.currency || signal.unitPrice !== fact.unitPrice || signal.quantity !== fact.quantity || signal.unit !== fact.unit) issues.push("target_price_mismatch");
    }
    if (fact.kind === "task_status") {
      const receipt = sources.tasks.receipts.find((row) => row.id === primary?.recordId);
      if (!receipt || receipt.entity.id !== fact.taskId || receipt.toStatus !== fact.toStatus || (fact.action === "completed" && receipt.action !== "task_completed")) issues.push("task_transition_unproved");
    }
    if (fact.kind === "sample_feedback") {
      const feedback = sources.samples.feedback.find((row) => row.id === fact.feedbackId);
      if (!feedback || feedback.projectId !== item.projectId || feedback.sampleVersionId !== fact.versionId || feedback.sampleId !== fact.sampleId) issues.push("sample_feedback_mismatch");
    }
    if (fact.kind === "sample_version") {
      const version = sources.samples.versions.find((row) => row.id === fact.versionId);
      if (!version || version.projectId !== item.projectId || version.sampleId !== fact.sampleId) issues.push("sample_version_mismatch");
      if (fact.action === "approved" && version?.reviewOutcome !== "Approved") issues.push("sample_approval_unproved");
    }
    if (fact.kind === "order_milestone") {
      const order = sources.orders.find((row) => row.id === fact.orderId);
      if (!order || order.projectId !== item.projectId) issues.push("order_scope_mismatch");
      if (fact.action === "po_received" && order?.poNumber.endsWith("-DEMO")) issues.push("draft_po_not_formal");
      if (fact.action === "contract_confirmed") {
        const event = order?.executionTimeline?.find((row) => row.id === fact.milestoneId && row.title === "Contract Confirmed");
        if (!event || !sources.contracts.some((row) => row.purchaseOrderId === fact.orderId && ["Confirmed", "Signed"].includes(row.status) && (row.confirmedAt === event.date || row.signedDate === event.date))) issues.push("contract_not_confirmed");
      }
      if (fact.action === "shipment_departed" && (!order?.executionTimeline?.some((row) => row.id === fact.milestoneId && row.title === "Shipment Departed") || !sources.shipments.some((row) => row.purchaseOrderId === fact.orderId && Boolean(row.departedDate) && ["Shipped", "In Transit", "Delivered"].includes(row.status)))) issues.push("shipment_not_departed");
    }
    if (fact.kind === "issue_event") {
      const event = sources.issues?.events.find((row) => row.id === fact.eventId && row.issueId === fact.issueId);
      const issue = sources.issues?.issues.find((row) => row.id === fact.issueId);
      if (!event || !issue || event.kind !== fact.action || issue.projectId !== item.projectId || issue.accountId !== item.accountId) issues.push("issue_scope_mismatch");
      if (event?.reportingRole === "activity" && !event.sourceRefs.length) issues.push("issue_event_lacks_evidence");
      if (fact.action === "customer_accepted" && !sources.issues?.responses.some((row) => row.id === event?.relatedId && row.issueId === fact.issueId && row.type === "accepted_resolution" && row.acceptanceEvidence)) issues.push("customer_acceptance_unproved");
    }
  }
  for (const proposalRef of item.evidence.filter((ref) => ref.recordType === "deal_proposal")) {
    const proposal = sources.dealRoom.proposals.find((row) => row.id === proposalRef.recordId);
    const receiptTarget = primary?.recordType === "task_receipt" ? sources.tasks.receipts.find((row) => row.id === primary.recordId)?.entity.id : undefined;
    if (!proposal || proposal.status !== "applied" || proposal.appliedTarget?.id !== (receiptTarget ?? primary?.recordId)) issues.push("unapplied_proposal");
    if (proposal && item.evidence.filter((ref) => ref.recordType === "deal_message").some((ref) => !proposal.sourceMessageIds.includes(ref.recordId) || !sources.dealRoom.messages.some((message) => message.id === ref.recordId && message.roomId === proposal.roomId))) issues.push("proposal_message_mismatch");
  }
  return [...new Set(issues)];
}
