import test from "node:test";
import assert from "node:assert/strict";
import { reportSources } from "./report-fixture";
import { adaptSources, businessTime, sourceExists, sourceRef } from "../lib/activity-memory/source-adapters";
import { assessMemory, businessDate } from "../lib/activity-memory/selectors";
import { correctMemory, emptyActivityMemory, reconcileMemory, voidMemory } from "../lib/activity-memory/projection";
import { addManualActivity } from "../lib/activity-memory/commands";
import { validateMemoryItem } from "../lib/activity-memory/validation";
import { changeTaskStatus, createWorkspaceTask } from "../lib/tasks/workspace";
import { reviewProposal } from "../lib/deal-room/commands";
import { applyReviewedProposal } from "../lib/deal-room/apply";
import { createSampleWorkspace } from "../components/samples/sample-data";

const period = { start: "2026-08-04", end: "2026-08-07", timeZone: "Asia/Shanghai" };
const at = "2026-08-05T09:00:00Z";

test("source existence and account/project scope are validated", () => {
  const sources = reportSources();
  assert.equal(sourceExists(sources, sourceRef("purchase_order", "po-efc-2411")), true);
  assert.equal(sourceExists(sources, sourceRef("purchase_order", "absent")), false);
  const item = adaptSources(sources).find((row) => row.logicalEventId === "purchase-order:po-efc-2411")!;
  assert.deepEqual(validateMemoryItem(item, sources), []);
  assert.ok(validateMemoryItem({ ...item, accountId: "client-nas" }, sources).includes("account_project_mismatch"));
  assert.ok(validateMemoryItem({ ...item, evidence: [{ ...item.evidence[0], recordId: "missing" }] }, sources).some((reason) => reason.startsWith("missing_source")));
});

test("stable source identity updates as a new revision, not a second accomplishment", () => {
  const sources = reportSources();
  const first = adaptSources(sources);
  const once = reconcileMemory(emptyActivityMemory(), first);
  const again = reconcileMemory(once, adaptSources(sources));
  assert.equal(again, once);
  sources.accounts.activities[0].title.zh += "（已更新）";
  const changed = reconcileMemory(again, adaptSources(sources));
  const logical = first.find((row) => row.logicalEventId === `account-activity:${sources.accounts.activities[0].id}`)!.logicalEventId;
  assert.equal(changed.items.filter((row) => row.logicalEventId === logical).length, 2);
  assert.equal(changed.items.filter((row) => row.logicalEventId === logical && row.status === "active").length, 1);
  assert.equal(changed.items.find((row) => row.logicalEventId === logical && row.status === "active")?.revision, 2);
});

test("correction and void preserve history and exclude stale revisions", () => {
  const sources = reportSources();
  const item = adaptSources(sources).find((row) => row.logicalEventId === "account-activity:activity-efc-call")!;
  const initial = reconcileMemory(emptyActivityMemory(), [item]);
  const corrected = correctMemory(initial, item.id, { zh: "已人工更正", en: "Human-corrected" }, "Incorrect wording");
  assert.equal(corrected.items[0].status, "superseded");
  assert.ok(assessMemory(corrected.items[0], sources, period).reasons.includes("superseded"));
  const active = corrected.items[1];
  assert.equal(active.supersedesId, item.id);
  assert.equal(voidMemory(corrected, active.id, "Duplicate").items[1].status, "voided");
  assert.ok(assessMemory(voidMemory(corrected, active.id, "Duplicate").items[1], sources, period).reasons.includes("voided"));
});

test("date-only business time and timezone conversion preserve the intended local date", () => {
  assert.deepEqual(businessTime("2026-08-05"), { kind: "date", value: "2026-08-05" });
  assert.equal(businessDate(businessTime("2026-08-05"), "America/Toronto"), "2026-08-05");
  assert.equal(businessDate(businessTime("2026-08-04T20:00:00Z"), "Asia/Shanghai"), "2026-08-05");
  assert.deepEqual(businessTime(), { kind: "unknown" });
});

test("outside-period, unknown performer, and ownership do not grant personal credit", () => {
  const sources = reportSources();
  const sample = adaptSources(sources).find((row) => row.logicalEventId.startsWith("sample-version:"))!;
  assert.equal(sample.attribution.performedByActorId, undefined);
  assert.ok(assessMemory(sample, sources, { ...period, ownerActorId: sources.projects.find((project) => project.id === sample.projectId)?.ownerActorId }).reasons.includes("actor_unknown"));
  const account = adaptSources(sources).find((row) => row.logicalEventId === "account-activity:activity-efc-call")!;
  assert.ok(assessMemory(account, sources, { start: "2026-08-08", end: "2026-08-09", timeZone: "Asia/Shanghai" }).reasons.includes("outside_period"));
});

test("task creation, completion, and reopening have distinct receipts and business times", () => {
  const sources = reportSources();
  const task = { ...sources.tasks.tasks[0], id: "task-report-test", status: "待处理" as const, origin: "manual" as const };
  const created = createWorkspaceTask(sources.tasks, task, "actor-sales-a", at, "create-report-test");
  const completed = changeTaskStatus(created, task.id, "已完成", "actor-sales-a", "2026-08-06T09:00:00Z", "complete-report-test");
  const reopened = changeTaskStatus(completed, task.id, "待处理", "actor-sales-a", "2026-08-07T09:00:00Z", "reopen-report-test");
  sources.tasks = reopened;
  assert.deepEqual(reopened.receipts.slice(-3).map((row) => row.action), ["task_created", "task_completed", "task_reopened"]);
  const events = adaptSources(sources).filter((row) => row.logicalEventId.startsWith("task-change:"));
  assert.equal(events.length, 3);
  assert.notEqual(events[0].id, events[1].id);
  assert.equal(events.find((row) => row.subtype === "task_completed")?.occurred.kind, "instant");
});

test("unapplied Deal Room proposals and raw messages never become accomplishments", () => {
  const sources = reportSources();
  const items = adaptSources(sources);
  assert.equal(items.some((row) => row.evidence[0]?.recordType === "deal_message"), false);
  assert.equal(items.some((row) => row.evidence[0]?.recordType === "deal_proposal"), false);
  assert.equal(items.some((row) => row.logicalEventId === "price-signal:signal-proposal-nas-price"), false);
});

test("applied task uses one receipt event with proposal/message lineage, not three results", () => {
  const sources = reportSources();
  const reviewed = reviewProposal(sources.dealRoom, "proposal-nas-action", "actor-sales-a", at, {});
  const applied = applyReviewedProposal(reviewed, "proposal-nas-action", { accounts: sources.accounts, projects: sources.projects, samples: createSampleWorkspace(), actorId: "actor-sales-a", at });
  sources.dealRoom = applied.dealRoom;
  const task = { ...applied.dealRoom.tasks[0], origin: "deal_room" as const };
  sources.tasks = createWorkspaceTask(sources.tasks, task, "actor-sales-a", at, "deal-proposal-nas-action", [sourceRef("deal_proposal", "proposal-nas-action")]);
  const item = adaptSources(sources).find((row) => row.logicalEventId === "task-change:deal-proposal-nas-action")!;
  assert.equal(adaptSources(sources).filter((row) => row.logicalEventId === item.logicalEventId).length, 1);
  assert.equal(item.evidence[0].recordType, "task_receipt");
  assert.ok(item.evidence.some((ref) => ref.recordType === "deal_proposal"));
  assert.ok(item.evidence.some((ref) => ref.recordType === "deal_message"));
  assert.deepEqual(validateMemoryItem(item, sources), []);
});

test("manual activity has explicit author/date but remains a labeled human note", () => {
  const sources = reportSources();
  const state = addManualActivity(emptyActivityMemory(), { id: "manual-test", authorActorId: "actor-sales-a", performedByActorId: "actor-sales-a", occurred: { kind: "date", value: "2026-08-05" }, projectId: 1, category: "customer_interaction", description: "Recorded demo follow-up", participantActorIds: [], sourceRefs: [], recordedAt: at });
  sources.manualEntries = state.manualEntries;
  const item = adaptSources(sources).find((row) => row.logicalEventId === "manual:manual-test")!;
  assert.equal(item.manual, true);
  assert.equal(item.attribution.performedByActorId, "actor-sales-a");
  assert.equal(assessMemory(item, sources, { ...period, ownerActorId: "actor-sales-a" }).eligible, true);
  const recorderOnly = { ...state.manualEntries[0], id: "manual-recorder-only", performedByActorId: undefined };
  sources.manualEntries = [recorderOnly];
  const uncredited = adaptSources(sources).find((row) => row.logicalEventId === "manual:manual-recorder-only")!;
  assert.ok(assessMemory(uncredited, sources, { ...period, ownerActorId: "actor-sales-a" }).reasons.includes("actor_unknown"));
  assert.throws(() => addManualActivity(state, { ...state.manualEntries[0], id: "invalid", occurred: { kind: "unknown" } }));
});

test("financial, sample, product, and logistics adapters do not infer unsupported milestones", () => {
  const sources = reportSources();
  const items = adaptSources(sources);
  assert.equal(items.some((row) => row.projectId === 1 && row.facts.some((fact) => fact.kind === "order_milestone" && fact.action === "po_received")), false);
  assert.equal(items.some((row) => row.projectId === 3 && row.facts.some((fact) => fact.kind === "quotation")), false);
  assert.equal(items.some((row) => row.facts.some((fact) => fact.kind === "order_milestone" && fact.action === "shipment_departed")), false);
  assert.equal(items.some((row) => row.facts.some((fact) => fact.kind === "order_milestone" && fact.action === "milestone_completed")), false);
  assert.equal(items.some((row) => row.facts.some((fact) => fact.kind === "sample_version" && fact.action === "approved")), false);
  assert.equal(items.some((row) => row.evidence[0].recordType === "project_product" && row.reportingRole === "activity"), false);
  assert.equal(items.some((row) => row.subtype.includes("payment")), false);
});

test("customer target price is not a quotation, accepted quotation is not a PO, and draft PO is not formal", () => {
  const sources = reportSources();
  const quote = adaptSources(sources).find((row) => row.facts.some((fact) => fact.kind === "quotation" && fact.action === "accepted"));
  assert.ok(quote);
  assert.equal(quote.facts[0].kind, "quotation");
  assert.equal(quote.facts.some((fact) => fact.kind === "order_milestone"), false);
  const draft = structuredClone(sources.orders[0]);
  draft.id = "draft-po-test"; draft.poNumber = "DRAFT-DEMO";
  sources.orders.push(draft);
  const draftItem = adaptSources(sources).find((row) => row.logicalEventId === "purchase-order:draft-po-test")!;
  assert.equal(draftItem.reportingRole, "background");
  assert.equal(draftItem.facts.length, 0);
});

test("recorded time is not substituted for unknown customer event time", () => {
  const sources = reportSources();
  const reviewed = reviewProposal(sources.dealRoom, "proposal-nas-price", "actor-sales-a", at, {});
  const applied = applyReviewedProposal(reviewed, "proposal-nas-price", { accounts: sources.accounts, projects: sources.projects, samples: createSampleWorkspace(), actorId: "actor-sales-a", at });
  sources.dealRoom = applied.dealRoom;
  const item = adaptSources(sources).find((row) => row.logicalEventId === "price-signal:signal-proposal-nas-price")!;
  assert.equal(item.occurred.kind, "unknown");
  assert.equal(item.sourceRecordedAt, at);
  assert.equal(item.facts[0].kind, "price_signal");
  assert.ok(assessMemory(item, sources, period).reasons.includes("background_only"));
});

test("false shipment, contract, and formal PO claims fail source-state checks", () => {
  const sources = reportSources();
  const actual = adaptSources(sources).find((row) => row.logicalEventId === "purchase-order:po-efc-2411")!;
  const forgedShipment = { ...actual, facts: [{ id: actual.facts[0].id, kind: "order_milestone" as const, orderId: "po-efc-2411", action: "shipment_departed" as const, milestoneId: "missing" }] };
  assert.ok(validateMemoryItem(forgedShipment, sources).includes("shipment_not_departed"));
  const forgedContract = { ...actual, facts: [{ id: actual.facts[0].id, kind: "order_milestone" as const, orderId: "po-efc-2411", action: "contract_confirmed" as const, milestoneId: "missing" }] };
  assert.ok(validateMemoryItem(forgedContract, sources).includes("contract_not_confirmed"));
  sources.orders[0].poNumber += "-DEMO";
  assert.ok(validateMemoryItem(actual, sources).includes("draft_po_not_formal"));
});

test("distinct source IDs remain distinct even with identical dates and descriptions", () => {
  const sources = reportSources();
  sources.manualEntries = ["one", "two"].map((id) => ({ id, authorActorId: "actor-sales-a", performedByActorId: "actor-sales-a", occurred: { kind: "date" as const, value: "2026-08-05" }, projectId: 1, category: "customer_interaction" as const, description: "Same description", participantActorIds: [], sourceRefs: [], recordedAt: at }));
  const entries = adaptSources(sources).filter((item) => item.logicalEventId.startsWith("manual:"));
  assert.equal(entries.length, 2);
  assert.notEqual(entries[0].logicalEventId, entries[1].logicalEventId);
});

test("tampering with an applied proposal target invalidates its Memory lineage", () => {
  const sources = reportSources();
  const reviewed = reviewProposal(sources.dealRoom, "proposal-nas-action", "actor-sales-a", at, {});
  const applied = applyReviewedProposal(reviewed, "proposal-nas-action", { accounts: sources.accounts, projects: sources.projects, samples: createSampleWorkspace(), actorId: "actor-sales-a", at });
  sources.dealRoom = applied.dealRoom;
  const task = { ...applied.dealRoom.tasks[0], origin: "deal_room" as const };
  sources.tasks = createWorkspaceTask(sources.tasks, task, "actor-sales-a", at, "deal-target-test", [sourceRef("deal_proposal", "proposal-nas-action")]);
  const memory = adaptSources(sources).find((item) => item.logicalEventId === "task-change:deal-target-test")!;
  const proposal = sources.dealRoom.proposals.find((item) => item.id === "proposal-nas-action")!;
  proposal.appliedTarget = { kind: "task", id: "another-task" };
  assert.ok(validateMemoryItem(memory, sources).includes("unapplied_proposal"));
});
