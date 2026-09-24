import test from "node:test";
import assert from "node:assert/strict";
import { createIssueWorkspace } from "../lib/issues/repository";
import { addIssueAction, addIssueSuggestion, addProductImprovement, applyIssueSuggestion, completeIssueAction, createIssue, recordCustomerResponse, resolveIssue, reviewIssueSuggestion, reviewProductImprovement, transitionIssue, updateRootCause } from "../lib/issues/commands";
import { customerSafeIssue } from "../lib/issues/integration";
import { formatIssueError } from "../lib/issues/labels";
import { validateIssue } from "../lib/issues/validation";
import { createAccountState } from "../lib/accounts/repository";
import { createDealRoomState } from "../lib/deal-room/repository";
import { projects } from "../lib/mock-data";
import { createSampleWorkspace } from "../components/samples/sample-data";
import { createOrderWorkspace } from "../components/orders/order-data";
import { mockProductLibraryRepository } from "../lib/product-library/repository";
import { adaptSources } from "../lib/activity-memory/source-adapters";
import { assessMemory } from "../lib/activity-memory/selectors";
import { reportSources } from "./report-fixture";
import { createReportContext } from "../lib/reports/context";
import { createReportPeriod } from "../lib/reports/period";
import { DemoReportGenerator } from "../lib/reports/generator";
import type { Issue, IssueResolution } from "../lib/issues/types";

const at = "2026-08-05T12:00:00Z";
const context = () => ({ accounts: createAccountState(), projects: structuredClone(projects), samples: createSampleWorkspace(), orders: createOrderWorkspace(), products: mockProductLibraryRepository.load() });
const both = (zh: string, en = zh) => ({ zh, en });
const newIssue = (): Issue => ({ ...structuredClone(createIssueWorkspace().issues[1]), id: "IS-TEST-01", title: both("演示包装核查", "Demo packaging check"), description: both("需核查包装说明", "Packaging instructions require review"), sourceRefs: [{ provider: "trimflow", recordType: "purchase_order", recordId: "po-efc-2411" }] });

test("validation codes become user-facing Chinese and English messages", () => {
  assert.equal(formatIssueError(new Error("invalid_severity,account_project_mismatch"), "zh"), "请选择有效的严重程度；客户与项目不匹配");
  assert.equal(formatIssueError(new Error("invalid_severity"), "en"), "Select a valid severity");
  assert.equal(formatIssueError(new Error("unknown_error"), "zh"), "操作未完成，请核对输入与关联资料");
});

test("seeded issues have coherent account, project, sample/order and evidence references", () => {
  const state = createIssueWorkspace(); const refs = context();
  assert.equal(state.issues.length, 3);
  for (const issue of state.issues) assert.deepEqual(validateIssue(issue, refs), []);
  assert.equal(state.issues.find((row) => row.id === "IS-NAS-COLOR-01")?.resolution?.customerOutcomeStatus, "accepted");
  assert.equal(state.issues.find((row) => row.id === "IS-EFC-MARK-01")?.status, "open");
  assert.equal(state.issues.find((row) => row.id === "IS-EYW-WEIGHT-01")?.rootCauseStatus, "unknown");
});

test("creation checks scope, severity and evidence while preserving sample and order snapshots", () => {
  const state = createIssueWorkspace(); const refs = context(); const beforeSamples = structuredClone(refs.samples); const beforeOrders = structuredClone(refs.orders);
  const added = createIssue(state, newIssue(), refs);
  assert.equal(added.issues.length, state.issues.length + 1);
  assert.deepEqual(refs.samples, beforeSamples); assert.deepEqual(refs.orders, beforeOrders);
  assert.throws(() => createIssue(state, { ...newIssue(), accountId: "client-nas" }, refs), /account_project_mismatch|order_scope_mismatch/);
  assert.throws(() => createIssue(state, { ...newIssue(), severity: "severe" as Issue["severity"] }, refs), /invalid_severity/);
  assert.throws(() => createIssue(state, { ...newIssue(), sourceRefs: [{ provider: "trimflow", recordType: "purchase_order", recordId: "missing" }] }, refs), /source_not_found/);
  assert.equal(added.issues[3].rootCauseStatus, "unknown");
});

test("status lifecycle, root cause certainty and action completion remain separate", () => {
  const seed = createIssueWorkspace(); const id = "IS-EFC-MARK-01";
  assert.throws(() => transitionIssue(seed, id, "closed", at, "actor-sales-a"), /invalid_status_transition/);
  assert.throws(() => transitionIssue(seed, id, "resolved", at, "actor-sales-a"), /resolution_required/);
  const triaged = transitionIssue(seed, id, "triaging", at, "actor-sales-a");
  assert.equal(triaged.issues.find((row) => row.id === id)?.status, "triaging");
  const suspected = updateRootCause(triaged, id, "suspected", both("待核实", "Needs verification"), at, "actor-sales-a", []);
  assert.equal(suspected.issues.find((row) => row.id === id)?.rootCauseStatus, "suspected");
  assert.throws(() => updateRootCause(triaged, id, "confirmed", both("待核实", "Needs verification"), at, "actor-sales-a", []), /confirmed_cause_requires_evidence/);
  const completed = completeIssueAction(suspected, "IA-EFC-MARK", at, "actor-sales-a");
  assert.equal(completed.actions.find((row) => row.id === "IA-EFC-MARK")?.status, "completed");
  assert.throws(() => completeIssueAction(completed, "IA-EFC-MARK", at, "actor-sales-a"), /action_not_open/);
  const addedAction = addIssueAction(completed, { id: "IA-TEST", issueId: id, type: "check", ownerActorId: "actor-sales-a", description: both("核查", "Check"), status: "open", createdAt: at, sourceRefs: [] });
  assert.equal(addedAction.actions.length, completed.actions.length + 1);
});

test("customer acceptance is not inferred from an ordinary response or resolution", () => {
  const seed = createIssueWorkspace(); const id = "IS-EFC-MARK-01";
  const updated = recordCustomerResponse(seed, { id: "IR-TEST", issueId: id, type: "corrective_plan", content: both("已发送方案", "Plan sent"), sentAt: at, actorId: "actor-sales-a", sourceRefs: [] });
  assert.equal(updated.events.at(-1)?.kind, "customer_response");
  assert.throws(() => recordCustomerResponse(seed, { id: "IR-ACCEPT", issueId: id, type: "accepted_resolution", content: both("接受", "Accepted"), sentAt: at, actorId: "actor-sales-a", sourceRefs: [] }), /acceptance_evidence_required/);
  const resolution: IssueResolution = { outcome: "resolved", whatDone: both("已核查", "Checked"), customerOutcome: both("未确认", "Pending"), customerOutcomeStatus: "accepted", internalLessons: both("先核对", "Check first"), resolvedByActorId: "actor-sales-a", resolvedAt: at, sourceRefs: [] };
  assert.throws(() => resolveIssue(updated, id, resolution), /customer_acceptance_not_evidenced/);
  const resolved = resolveIssue(updated, id, { ...resolution, customerOutcomeStatus: "pending" });
  assert.equal(resolved.issues.find((row) => row.id === id)?.status, "resolved");
  assert.equal(resolved.issues.find((row) => row.id === id)?.resolution?.customerOutcomeStatus, "pending");
});

test("Deal Room lead is not an issue; customer-safe DTO omits internal/factory fields", () => {
  const seed = createIssueWorkspace();
  const dealRoom = createDealRoomState();
  const room = dealRoom.rooms.find((row) => row.id === "room-nas-project")!;
  const messageId = dealRoom.messages.find((row) => row.roomId === room.id)!.id;
  const suggested = addIssueSuggestion(seed, { id: "SUG-TEST", roomId: room.id, accountId: "client-nas", projectId: 1, sourceMessageIds: [messageId], status: "suggested", suggestedAt: at }, dealRoom);
  assert.equal(suggested.issues.length, seed.issues.length);
  const reviewed = reviewIssueSuggestion(suggested, "SUG-TEST", "actor-sales-a", "reviewed");
  assert.throws(() => applyIssueSuggestion(reviewed, "SUG-TEST", "IS-NAS-COLOR-01"), /suggestion_issue_mismatch/);
  assert.throws(() => addIssueSuggestion(seed, { id: "BAD", roomId: room.id, accountId: "client-nas", projectId: 1, sourceMessageIds: ["missing"], status: "suggested", suggestedAt: at }, dealRoom), /suggestion_source_mismatch/);
  const withInternal = { ...seed, issues: seed.issues.map((issue) => issue.id === "IS-NAS-COLOR-01" ? { ...issue, factoryContext: both("内部演示工厂", "Internal demo factory") } : issue) };
  const safe = customerSafeIssue(withInternal, "IS-NAS-COLOR-01");
  assert.equal("factoryContext" in safe, false);
  assert.equal("description" in safe, false);
  assert.equal("rootCauseSummary" in safe, false);
  assert.equal("resolution" in safe, false);
  assert.equal("ownerActorId" in safe, false);
});

test("product improvement remains a pending recommendation and never mutates Product Library", () => {
  const state = createIssueWorkspace(); const refs = context(); const before = structuredClone(refs.products);
  const added = addProductImprovement(state, { id: "PI-TEST", issueId: "IS-NAS-COLOR-01", productId: "prod-waterproof", proposal: both("核对颜色样", "Review shade reference"), status: "pending", sourceRefs: state.issues[0].resolution!.sourceRefs, createdAt: at });
  assert.equal(added.improvements[0].status, "pending");
  const reviewed = reviewProductImprovement(added, "PI-TEST", "actor-sales-a", "reviewed");
  assert.equal(reviewed.improvements[0].status, "reviewed");
  assert.deepEqual(refs.products, before);
});

test("only evidence-backed issue milestones enter Activity Memory and future reports", () => {
  const sources = reportSources(); sources.issues = createIssueWorkspace();
  const items = adaptSources(sources);
  const efc = items.find((item) => item.logicalEventId === "issue-event:IE-EFC-1")!;
  assert.equal(efc.reportingRole, "activity");
  assert.equal(assessMemory(efc, sources, { start: "2026-08-05", end: "2026-08-06", timeZone: "Asia/Shanghai" }).eligible, true);
  assert.equal(items.find((item) => item.logicalEventId === "issue-event:IE-NAS-1")?.reportingRole, "background");
  const snapshot = createReportContext({ id: "issue-report", ownerActorId: "actor-sales-a", attributionMode: "team", period: createReportPeriod("daily", "2026-08-05"), language: "zh", capturedAt: at }, items, sources);
  const draft = new DemoReportGenerator().generate(snapshot, "report-issue", at, 1);
  assert.ok(draft.sections.some((section) => section.id === "issues_risks"));
  assert.ok(draft.sections.find((section) => section.id === "issues_risks")?.blocks.some((block) => block.memoryRevisionIds.includes(efc.id)));
  assert.equal(draft.sections.some((section) => section.id === "resolved_problems"), false);
});
