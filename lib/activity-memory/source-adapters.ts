import type { AccountState } from "../accounts/types";
import { resolveCanonicalAccountId } from "../accounts/selectors";
import type { DealRoomState } from "../deal-room/types";
import type { ActivityMemoryItem, BusinessTime, EntityRef, EvidenceReference, ManualActivityEntry, SourceRecordRef } from "./types";
import type { Communication, Contract, Delivery, NegotiationRecord, Project, PurchaseOrder, Quotation, SampleFeedback, SampleVersion, Shipment, TimelineEvent } from "../mock-data/types";
import type { ProductLibraryData } from "../product-library/types";
import type { TaskWorkspaceState } from "../tasks/workspace";

export type BusinessSources = {
  accounts: AccountState; dealRoom: DealRoomState; projects: Project[];
  projectActivities: TimelineEvent[]; timeline: TimelineEvent[]; communications: Communication[];
  samples: { versions: SampleVersion[]; feedback: SampleFeedback[] };
  quotations: Quotation[]; negotiations: NegotiationRecord[];
  orders: PurchaseOrder[]; contracts: Contract[]; deliveries: Delivery[]; shipments: Shipment[]; tasks: TaskWorkspaceState; products: ProductLibraryData;
  manualEntries: ManualActivityEntry[];
};

export const DEMO_REPORT_NOW = "2026-08-05T12:00:00Z";
export const businessTime = (value?: string): BusinessTime => !value ? { kind: "unknown" } : /^\d{4}-\d{2}-\d{2}$/.test(value) ? { kind: "date", value } : Number.isNaN(Date.parse(value)) ? { kind: "unknown" } : { kind: "instant", value };
export const sourceRef = (recordType: string, recordId: string, recordVersion?: string): SourceRecordRef => ({ provider: "trimflow", recordType, recordId, recordVersion });
const localized = (value: string) => ({ zh: value, en: value });
const englishUnit = (unit: string) => ({ "条": "pcs", "套": "sets", "件": "pieces" } as Record<string, string>)[unit] ?? unit;
const entity = (kind: EntityRef["kind"], id: string | number): EntityRef => ({ kind, id: String(id) });
const fingerprint = (value: unknown) => {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16);
};
type ItemInput = Pick<ActivityMemoryItem, "logicalEventId" | "accountId" | "projectId" | "category" | "subtype" | "occurred" | "summary" | "facts" | "reportingRole"> & {
  primary: SourceRecordRef; capturedAt: string; entities?: EntityRef[]; sourceRecordedAt?: string;
  performedByActorId?: string; recordedByActorId?: string; participantActorIds?: string[];
  reviewedByActorId?: string; appliedByActorId?: string; ownerAtOccurrence?: string;
  lineage?: SourceRecordRef[]; causalGroupId?: string; importanceReason?: string; manual?: boolean;
};

function makeItem(input: ItemInput): ActivityMemoryItem {
  const uniqueLineage = [...new Map((input.lineage ?? []).map((ref) => [`${ref.provider}:${ref.recordType}:${ref.recordId}`, ref])).values()];
  const sourceFingerprint = fingerprint([input.primary, input.summary, input.facts, input.occurred, input.performedByActorId, input.reportingRole, uniqueLineage]);
  const evidenceFor = (ref: SourceRecordRef, role: EvidenceReference["role"], index: number): EvidenceReference => ({
    ...ref, id: `${input.logicalEventId}:e${index}`, recordVersion: role === "primary" ? sourceFingerprint : ref.recordVersion,
    role, supportedFactIds: role === "primary" ? input.facts.map((fact) => fact.id) : [], capturedAt: input.capturedAt,
    sourceTimePrecision: input.occurred.kind, target: input.entities?.[0],
  });
  return {
    id: `${input.logicalEventId}:r1`, logicalEventId: input.logicalEventId, revision: 1, workspaceId: "demo",
    accountId: input.accountId, projectId: input.projectId, entities: input.entities ?? [],
    category: input.category, subtype: input.subtype, occurred: input.occurred, sourceRecordedAt: input.sourceRecordedAt,
    capturedAt: input.capturedAt,
    attribution: { performedByActorId: input.performedByActorId, recordedByActorId: input.recordedByActorId,
      participantActorIds: input.participantActorIds ?? [], reviewedByActorId: input.reviewedByActorId,
      appliedByActorId: input.appliedByActorId, ownerAtOccurrence: input.ownerAtOccurrence },
    summary: input.summary, facts: input.facts,
    evidence: [evidenceFor(input.primary, "primary", 0), ...uniqueLineage.map((ref, index) => evidenceFor(ref, "lineage", index + 1))],
    causalGroupId: input.causalGroupId, status: "active", visibility: "demo_shared", sourceFingerprint,
    reportingRole: input.reportingRole, importanceReason: input.importanceReason, manual: input.manual,
  };
}

export function sourceExists(sources: BusinessSources, ref: SourceRecordRef): boolean {
  if (ref.provider !== "trimflow") return false;
  const id = ref.recordId;
  switch (ref.recordType) {
    case "account_activity": return sources.accounts.activities.some((item) => item.id === id);
    case "account_discovery": return sources.accounts.discoveries.some((item) => item.id === id);
    case "account_event": return sources.accounts.events.some((item) => item.id === id);
    case "referral": return sources.accounts.referrals.some((item) => item.id === id);
    case "contact": return sources.accounts.people.some((item) => item.id === id);
    case "project_timeline": return sources.timeline.some((item) => item.id === id);
    case "project_activity": return sources.projectActivities.some((item) => item.id === id);
    case "communication": return sources.communications.some((item) => item.id === id);
    case "sample_version": return sources.samples.versions.some((item) => item.id === id);
    case "sample_feedback": return sources.samples.feedback.some((item) => item.id === id);
    case "quotation": return sources.quotations.some((item) => item.id === id);
    case "negotiation": return sources.negotiations.some((item) => item.id === id);
    case "purchase_order": return sources.orders.some((item) => item.id === id);
    case "contract": return sources.contracts.some((item) => item.id === id);
    case "delivery": return sources.deliveries.some((item) => item.id === id);
    case "order_timeline": return sources.orders.some((order) => order.executionTimeline?.some((item) => item.id === id));
    case "shipment": return sources.shipments.some((item) => item.id === id);
    case "task": return sources.tasks.tasks.some((item) => item.id === id);
    case "task_receipt": return sources.tasks.receipts.some((item) => item.id === id);
    case "deal_proposal": return sources.dealRoom.proposals.some((item) => item.id === id);
    case "deal_message": return sources.dealRoom.messages.some((item) => item.id === id);
    case "target_price_signal": return sources.dealRoom.targetPriceSignals.some((item) => item.id === id);
    case "requirement": return sources.dealRoom.requirements.some((item) => item.id === id);
    case "project_product": return sources.products.projectProducts.some((item) => item.id === id);
    case "manual_activity": return sources.manualEntries.some((item) => item.id === id);
    default: return false;
  }
}

export function adaptSources(sources: BusinessSources, capturedAt = DEMO_REPORT_NOW): ActivityMemoryItem[] {
  const output: ActivityMemoryItem[] = [];
  const push = (input: Omit<ItemInput, "capturedAt">) => output.push(makeItem({ ...input, capturedAt }));
  const canonical = (id: string) => { try { return resolveCanonicalAccountId(sources.accounts, id); } catch { return id; } };
  const projectAccount = (id: number) => sources.projects.find((item) => item.id === id)?.clientId;
  const proposalFor = (kind: string, id: string) => sources.dealRoom.proposals.find((proposal) => proposal.status === "applied" && proposal.appliedTarget?.kind === kind && proposal.appliedTarget.id === id && sources.dealRoom.rooms.some((room) => room.id === proposal.roomId));
  const proposalLineage = (proposal: NonNullable<ReturnType<typeof proposalFor>>) => [sourceRef("deal_proposal", proposal.id), ...proposal.sourceMessageIds.map((id) => sourceRef("deal_message", id))];

  for (const record of sources.accounts.activities) {
    const proposal = proposalFor("account_activity", record.id);
    const isBackfill = Boolean(proposal);
    push({ logicalEventId: `account-activity:${record.id}`, accountId: canonical(record.accountId), projectId: record.projectId,
      category: "customer_interaction", subtype: record.type, occurred: isBackfill ? { kind: "unknown" } : businessTime(record.occurredAt),
      sourceRecordedAt: record.occurredAt, summary: record.title,
      facts: [{ id: `account-activity:${record.id}:fact`, kind: "interaction", channel: record.type, detail: record.detail }],
      primary: sourceRef("account_activity", record.id), lineage: proposal ? proposalLineage(proposal) : undefined,
      recordedByActorId: record.actorId, performedByActorId: isBackfill ? undefined : record.actorId,
      reviewedByActorId: proposal?.reviewedByActorId, appliedByActorId: proposal?.appliedByActorId,
      causalGroupId: proposal ? `deal:${proposal.id}` : undefined, reportingRole: record.type === "shared_note" || isBackfill ? "background" : "activity",
      importanceReason: record.type === "meeting" ? "customer meeting" : "customer interaction", entities: [entity("account", canonical(record.accountId))] });
  }
  for (const record of sources.accounts.discoveries) push({ logicalEventId: `discovery:${record.id}`, accountId: canonical(record.accountId), projectId: record.projectId,
    category: "relationship_update", subtype: "account_discovered", occurred: businessTime(record.discoveredAt), sourceRecordedAt: record.recordedAt,
    summary: record.sourceDetail, facts: [{ id: `discovery:${record.id}:fact`, kind: "relationship", contactId: record.contactId ?? "", action: "discovered" }],
    primary: sourceRef("account_discovery", record.id), performedByActorId: record.discoveredByActorId, recordedByActorId: record.recordedByActorId,
    reportingRole: record.accountId === canonical(record.accountId) ? "activity" : "background", importanceReason: "customer development" });
  for (const record of sources.accounts.referrals) {
    const proposal = proposalFor("referral", record.id);
    push({ logicalEventId: `referral:${record.id}`, accountId: canonical(record.accountId), projectId: record.projectId,
      category: "relationship_update", subtype: "referral_recorded", occurred: proposal ? { kind: "unknown" } : businessTime(record.introducedAt), sourceRecordedAt: record.recordedAt,
      summary: record.sourceDetail ?? localized(`Contact introduced: ${record.introducedContactId}`), facts: [{ id: `referral:${record.id}:fact`, kind: "relationship", contactId: record.introducedContactId, action: "introduced" }],
      primary: sourceRef("referral", record.id), lineage: proposal ? proposalLineage(proposal) : undefined,
      recordedByActorId: record.recordedByActorId, participantActorIds: !proposal && record.recipient.kind === "actor" ? [record.recipient.id] : [],
      appliedByActorId: proposal?.appliedByActorId, reportingRole: proposal ? "background" : "activity", importanceReason: "new referral" });
  }
  for (const record of sources.accounts.events) if (record.type === "ownership_transferred") push({ logicalEventId: `account-event:${record.id}`, accountId: canonical(record.accountId), category: "internal_coordination", subtype: record.type,
    occurred: businessTime(record.occurredAt), summary: localized("Account ownership transferred / 客户负责人已移交"), facts: [{ id: `account-event:${record.id}:fact`, kind: "interaction", channel: "internal", detail: localized(record.type) }],
    primary: sourceRef("account_event", record.id), performedByActorId: record.actorId, reportingRole: "governance" });

  const linkedIds = new Set([
    ...sources.samples.versions.map((item) => item.id), ...sources.samples.feedback.map((item) => item.id),
    ...sources.quotations.map((item) => item.id), ...sources.negotiations.map((item) => item.id),
    ...sources.orders.map((item) => item.id), ...sources.contracts.map((item) => item.id),
  ]);
  for (const [record, isManualProject] of [
    ...sources.timeline.map((item) => [item, false] as const),
    ...sources.projectActivities.map((item) => [item, true] as const),
  ]) {
    if (!isManualProject && record.relatedEntityId && linkedIds.has(record.relatedEntityId)) continue;
    if (!isManualProject && record.type === "inquiry" && sources.communications.some((item) => item.projectId === record.projectId && item.type === "客户邮件" && item.occurredAt.slice(0, 10) === record.occurredAt.slice(0, 10))) continue;
    const relatedDelivery = record.type === "delivery" && record.relatedEntityId ? sources.deliveries.find((item) => item.id === record.relatedEntityId && item.projectId === record.projectId) : undefined;
    push({ logicalEventId: `${isManualProject ? "project-activity" : "project-timeline"}:${record.id}`, accountId: canonical(record.clientId), projectId: record.projectId,
      category: record.type === "sample" ? "sample_update" : record.type === "quotation" || record.type === "negotiation" ? "commercial_update" : record.type === "task" ? "task_update" : record.type === "communication" || record.type === "inquiry" ? "customer_interaction" : "project_update",
      subtype: record.type, occurred: businessTime(record.occurredAt), summary: localized(record.title),
      facts: [{ id: `project-activity:${record.id}:fact`, kind: "interaction", channel: record.type, detail: localized(record.description) }],
      primary: sourceRef(isManualProject ? "project_activity" : "project_timeline", record.id),
      lineage: relatedDelivery ? [sourceRef("delivery", relatedDelivery.id)] : undefined,
      reportingRole: isManualProject || (record.type === "delivery" && !relatedDelivery) ? "background" : "activity", importanceReason: "project milestone" });
  }
  for (const record of sources.communications) {
    if (record.relatedEntityId) continue;
    push({ logicalEventId: `communication:${record.id}`, accountId: canonical(record.clientId), projectId: record.projectId,
      category: "customer_interaction", subtype: "communication_recorded", occurred: businessTime(record.occurredAt), summary: localized(record.subject),
      facts: [{ id: `communication:${record.id}:fact`, kind: "interaction", channel: record.type, detail: localized(record.content) }],
      primary: sourceRef("communication", record.id), reportingRole: "activity", importanceReason: "customer communication" });
  }
  for (const record of sources.samples.versions) push({ logicalEventId: `sample-version:${record.id}`, projectId: record.projectId, accountId: projectAccount(record.projectId),
    category: "sample_update", subtype: "version_created", occurred: businessTime(record.createdAt), summary: { zh: `创建样品版本 ${record.sampleId} ${record.version}：${record.summary}`, en: `Sample version ${record.sampleId} ${record.version} created` },
    facts: [{ id: `sample-version:${record.id}:fact`, kind: "sample_version", sampleId: record.sampleId, versionId: record.id, action: "created" }],
    primary: sourceRef("sample_version", record.id), entities: [entity("sample_version", record.id)], reportingRole: "activity", importanceReason: "sample version" });
  for (const record of sources.samples.feedback) {
    const proposal = proposalFor("sample_feedback", record.id);
    push({ logicalEventId: `sample-feedback:${record.id}`, projectId: record.projectId, accountId: projectAccount(record.projectId), category: "sample_update", subtype: "feedback_received",
      occurred: proposal ? { kind: "unknown" } : businessTime(record.receivedAt), sourceRecordedAt: proposal?.appliedAt,
      summary: localized(record.summary), facts: [{ id: `sample-feedback:${record.id}:fact`, kind: "sample_feedback", sampleId: record.sampleId, versionId: record.sampleVersionId, feedbackId: record.id, resolution: record.resolution === "Resolved" ? "resolved" : "open" }],
      primary: sourceRef("sample_feedback", record.id), lineage: proposal ? proposalLineage(proposal) : undefined, entities: [entity("sample_version", record.sampleVersionId)],
      reviewedByActorId: proposal?.reviewedByActorId, appliedByActorId: proposal?.appliedByActorId,
      reportingRole: proposal ? "background" : "activity", importanceReason: "sample feedback" });
  }
  for (const record of sources.quotations) {
    if (record.status === "Draft" || record.status === "Internal Review") continue;
    push({ logicalEventId: `quotation:${record.id}`, projectId: record.projectId, accountId: canonical(record.clientId), category: "commercial_update", subtype: "quotation_sent",
      occurred: businessTime(record.issuedAt), summary: { zh: `报价 ${record.id} 已发送：${record.currency} ${record.unitPrice} / ${record.unit}，数量 ${record.quantity} ${record.unit}`, en: `Quotation ${record.id} sent: ${record.currency} ${record.unitPrice} / ${englishUnit(record.unit)} at ${record.quantity} ${englishUnit(record.unit)}` },
      facts: [{ id: `quotation:${record.id}:fact`, kind: "quotation", quotationId: record.id, currency: record.currency, unitPrice: record.unitPrice, quantity: record.quantity, action: "sent" }],
      primary: sourceRef("quotation", record.id), entities: [entity("quotation", record.id)], reportingRole: "activity", importanceReason: "quotation milestone" });
  }
  for (const record of sources.negotiations) {
    const quote = sources.quotations.find((item) => item.id === record.quotationId);
    const accepted = record.type === "Commercial Confirmation" && quote?.status === "Accepted";
    push({ logicalEventId: `negotiation:${record.id}`, projectId: record.projectId, accountId: projectAccount(record.projectId),
    category: "commercial_update", subtype: "negotiation_recorded", occurred: businessTime(record.recordedAt), summary: localized(record.summary),
    facts: accepted && quote ? [{ id: `negotiation:${record.id}:fact`, kind: "quotation", quotationId: quote.id, currency: quote.currency, unitPrice: quote.unitPrice, quantity: quote.quantity, action: "accepted" }] : [{ id: `negotiation:${record.id}:fact`, kind: "interaction", channel: record.direction, detail: localized(record.summary) }], primary: sourceRef("negotiation", record.id),
    lineage: accepted ? [sourceRef("quotation", record.quotationId)] : undefined,
    entities: [entity("quotation", record.quotationId)], reportingRole: record.direction === "内部建议" ? "background" : "activity", importanceReason: accepted ? "accepted quotation" : "commercial discussion" });
  }
  for (const record of sources.orders) {
    const isFormal = !record.poNumber.endsWith("-DEMO");
    push({ logicalEventId: `purchase-order:${record.id}`, projectId: record.projectId, accountId: canonical(record.clientId), category: "order_update",
      subtype: isFormal ? "po_received" : "draft_po_created", occurred: businessTime(record.poDate),
      summary: localized(isFormal ? `PO ${record.poNumber} received / 已收到正式 PO ${record.poNumber}` : `Session draft PO ${record.poNumber} created / 已创建演示 PO 草稿`),
      facts: isFormal ? [{ id: `purchase-order:${record.id}:fact`, kind: "order_milestone", orderId: record.id, action: "po_received" }] : [],
      primary: sourceRef("purchase_order", record.id), entities: [entity("order", record.id)], reportingRole: isFormal ? "activity" : "background", importanceReason: "order milestone" });
    for (const event of record.executionTimeline ?? []) {
      if (event.title === "PO Received") continue;
      const shipment = sources.shipments.find((item) => item.purchaseOrderId === record.id);
      const contract = sources.contracts.find((item) => item.purchaseOrderId === record.id);
      const contractConfirmed = event.title === "Contract Confirmed" && Boolean(contract && ["Confirmed", "Signed"].includes(contract.status) && (contract.confirmedAt === event.date || contract.signedDate === event.date));
      const isActual = contractConfirmed || (event.title === "Shipment Departed" && Boolean(shipment?.departedDate && shipment.departedDate === event.date && ["Shipped", "In Transit", "Delivered"].includes(shipment.status)));
      push({ logicalEventId: `order-timeline:${event.id}`, accountId: canonical(record.clientId), projectId: record.projectId, category: "order_update", subtype: event.title.toLowerCase().replace(/\s+/g, "_"),
        occurred: businessTime(event.date), summary: { zh: ({ "Contract Confirmed": "合同已确认", "Shipment Departed": "货物已发运", "Delivery Plan Created": "已建立交付计划" } as Record<string, string>)[event.title] ?? event.title, en: event.title }, facts: isActual ? [{ id: `order-timeline:${event.id}:fact`, kind: "order_milestone", orderId: record.id, action: event.title === "Contract Confirmed" ? "contract_confirmed" : "shipment_departed", milestoneId: event.id }] : [],
        primary: sourceRef("order_timeline", event.id), lineage: contractConfirmed && contract ? [sourceRef("contract", contract.id)] : event.title === "Shipment Departed" && shipment ? [sourceRef("shipment", shipment.id)] : undefined,
        entities: [entity("order", record.id)], reportingRole: isActual ? "activity" : "background", importanceReason: isActual ? "order milestone" : undefined });
    }
  }
  for (const signal of sources.dealRoom.targetPriceSignals) {
    const proposal = proposalFor("commercial_signal", signal.id);
    if (!proposal || proposal.id !== signal.sourceProposalId) continue;
    push({ logicalEventId: `price-signal:${signal.id}`, accountId: canonical(signal.accountId), projectId: signal.projectId, category: "commercial_update", subtype: "customer_target_recorded",
      occurred: { kind: "unknown" }, sourceRecordedAt: signal.recordedAt,
      summary: localized(`Customer target ${signal.currency} ${signal.unitPrice} / ${signal.unit} at ${signal.quantity} ${signal.unit}; pending commercial confirmation.`),
      facts: [{ id: `price-signal:${signal.id}:fact`, kind: "price_signal", signalId: signal.id, currency: signal.currency, unitPrice: signal.unitPrice, quantity: signal.quantity, unit: signal.unit, role: "customer_target" }],
      primary: sourceRef("target_price_signal", signal.id), lineage: proposalLineage(proposal), reportingRole: "background", importanceReason: "customer price signal" });
  }
  for (const receipt of sources.tasks.receipts) {
    const task = sources.tasks.tasks.find((item) => item.id === receipt.entity.id);
    if (!task) continue;
    const proposal = task.sourceProposalId ? proposalFor("task", task.id) : undefined;
    if (task.sourceProposalId && !proposal) continue;
    push({ logicalEventId: `task-change:${receipt.commandId}`, accountId: task.accountId, projectId: task.projectId, category: "task_update", subtype: receipt.action,
      occurred: businessTime(receipt.occurredAt), summary: localized(`${task.title} · ${receipt.action}`),
      facts: [{ id: `task-change:${receipt.commandId}:fact`, kind: "task_status", taskId: task.id, fromStatus: receipt.fromStatus, toStatus: receipt.toStatus ?? task.status, action: receipt.action === "task_completed" ? "completed" : receipt.action === "task_reopened" ? "reopened" : "created" }],
      primary: sourceRef("task_receipt", receipt.id), lineage: [...receipt.sourceRefs, ...(proposal ? proposalLineage(proposal) : [])],
      performedByActorId: receipt.performedByActorId, causalGroupId: `task:${task.id}`, entities: [entity("task", task.id)],
      reportingRole: "activity", importanceReason: receipt.action === "task_completed" ? "completed action" : "task state changed" });
  }
  for (const relation of sources.products.projectProducts) if (relation.proposalStatus === "proposed") push({ logicalEventId: `project-product:${relation.id}`, projectId: relation.projectId, accountId: projectAccount(relation.projectId),
    category: "project_update", subtype: "product_proposed_internally", occurred: businessTime(relation.createdAt), summary: localized("Product marked proposed in project; customer presentation is not confirmed."),
    facts: [{ id: `project-product:${relation.id}:fact`, kind: "interaction", channel: "internal", detail: relation.applicationNote }],
    primary: sourceRef("project_product", relation.id), entities: [entity("product", relation.productId)], reportingRole: "background" });
  for (const entry of sources.manualEntries) push({ logicalEventId: `manual:${entry.id}`, accountId: entry.accountId ?? projectAccount(entry.projectId ?? -1), projectId: entry.projectId,
    category: entry.category, subtype: "manual_entry", occurred: entry.occurred, sourceRecordedAt: entry.recordedAt,
    summary: localized(entry.description), facts: [{ id: `manual:${entry.id}:fact`, kind: "interaction", channel: "manual", detail: localized(entry.description) }],
    primary: sourceRef("manual_activity", entry.id), lineage: entry.sourceRefs,
    performedByActorId: entry.performedByActorId, recordedByActorId: entry.authorActorId, participantActorIds: entry.participantActorIds,
    reportingRole: "activity", manual: true, importanceReason: "manual activity" });
  return output;
}
