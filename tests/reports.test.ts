import test from "node:test";
import assert from "node:assert/strict";
import { reportSources } from "./report-fixture";
import { adaptSources } from "../lib/activity-memory/source-adapters";
import { createReportPeriod } from "../lib/reports/period";
import { createReportContext } from "../lib/reports/context";
import { DemoReportGenerator } from "../lib/reports/generator";
import { emptyReportState } from "../lib/reports/types";
import { addReportHumanNote, editReportBlock, finalizeReport, generateReport, reviewReport } from "../lib/reports/commands";
import { validateReportDraft } from "../lib/reports/validation";
import type { BusinessSources } from "../lib/activity-memory/source-adapters";
import type { ReportKind } from "../lib/reports/types";

const now = "2026-09-23T12:00:00Z";
function context(sources: BusinessSources, kind: ReportKind = "daily", date = "2026-08-05", id = "context:test") {
  return createReportContext({ id, ownerActorId: "actor-sales-a", period: createReportPeriod(kind, date, "Asia/Shanghai"), language: "zh", capturedAt: now }, adaptSources(sources), sources);
}

test("report periods use local day and Monday-to-Monday week, not UTC business day", () => {
  const day = createReportPeriod("daily", "2026-08-05", "Asia/Shanghai");
  assert.equal(day.startInclusive, "2026-08-04T16:00:00.000Z");
  assert.equal(day.endExclusive, "2026-08-05T16:00:00.000Z");
  const week = createReportPeriod("weekly", "2026-08-05", "Asia/Shanghai");
  assert.equal(week.localStartDate, "2026-08-03");
  assert.equal(week.localEndDate, "2026-08-10");
});

test("daily report uses only eligible current Memory and exposes source IDs", () => {
  const sources = reportSources();
  const snapshot = context(sources);
  assert.ok(snapshot.memory.length > 0);
  assert.ok(snapshot.memory.every((item) => item.attribution.performedByActorId === "actor-sales-a" || item.attribution.participantActorIds.includes("actor-sales-a")));
  const { draft } = generateReport(emptyReportState(), snapshot, new DemoReportGenerator(), now);
  assert.equal(draft.kind, "daily");
  assert.equal(draft.generatorType, "demo");
  assert.equal(draft.validation.issues.length, 0);
  for (const block of draft.sections.flatMap((section) => section.blocks).filter((block) => block.kind === "fact")) {
    assert.ok(block.memoryRevisionIds.length > 0);
    assert.ok(block.factIds.length > 0);
  }
  assert.equal(draft.sections.some((section) => section.id === "order_update"), false);
});

test("team summary can include verified business facts without crediting the report owner", () => {
  const sources = reportSources();
  const personal = context(sources);
  const team = createReportContext({ id: "context:team", ownerActorId: "actor-sales-a", attributionMode: "team", period: createReportPeriod("daily", "2026-08-05", "Asia/Shanghai"), language: "zh", capturedAt: now }, adaptSources(sources), sources);
  assert.ok(team.memory.length > personal.memory.length);
  assert.ok(team.memory.some((item) => !item.attribution.performedByActorId));
  const { draft } = generateReport(emptyReportState(), team, new DemoReportGenerator(), now);
  assert.equal(draft.attributionMode, "team");
  assert.equal(draft.validation.issues.length, 0);
  assert.equal(draft.sections.flatMap((section) => section.blocks).some((block) => block.text.en.includes("Demo Sales A completed")), false);
});

test("weekly report aggregates weekly Memory directly and does not concatenate daily text", () => {
  const sources = reportSources();
  const snapshot = context(sources, "weekly");
  const { draft } = generateReport(emptyReportState(), snapshot, new DemoReportGenerator(), now);
  assert.equal(draft.kind, "weekly");
  assert.ok(draft.sections.some((section) => section.id === "highlights"));
  assert.equal(draft.validation.issues.length, 0);
  assert.equal(snapshot.period.localStartDate, "2026-08-03");
  assert.ok(draft.sections.flatMap((section) => section.blocks).filter((block) => block.kind === "fact").every((block) => block.memoryRevisionIds.every((id) => snapshot.memory.some((item) => item.id === id))));
});

test("empty activity does not manufacture achievements", () => {
  const sources = reportSources();
  const snapshot = context(sources, "daily", "2026-01-01");
  assert.equal(snapshot.memory.length, 0);
  const { draft } = generateReport(emptyReportState(), snapshot, new DemoReportGenerator(), now);
  assert.equal(draft.sections.flatMap((section) => section.blocks).filter((block) => block.kind === "fact").length, 0);
});

test("generator never mutates Tasks or turns next actions into confirmed new Tasks", () => {
  const sources = reportSources();
  const before = structuredClone(sources.tasks);
  const snapshot = context(sources);
  const { draft } = generateReport(emptyReportState(), snapshot, new DemoReportGenerator(), now);
  assert.deepEqual(sources.tasks, before);
  assert.ok(draft.sections.flatMap((section) => section.blocks).filter((block) => block.kind === "recommendation").every((block) => block.actionKind === "existing_task"));
});

test("editing a Fact becomes Human Note, clears inherited evidence, and reruns validation", () => {
  const sources = reportSources();
  const snapshot = context(sources);
  const generated = generateReport(emptyReportState(), snapshot, new DemoReportGenerator(), now);
  const fact = generated.draft.sections.flatMap((section) => section.blocks).find((block) => block.kind === "fact")!;
  const edited = editReportBlock(generated.state, generated.draft.id, fact.id, { zh: "人工改写的新断言", en: "Human rewrite" }, "2026-09-23T12:01:00Z");
  const block = edited.drafts[0].sections.flatMap((section) => section.blocks).find((row) => row.id === fact.id)!;
  assert.equal(block.kind, "human_note");
  assert.equal(block.validation, "needs_review");
  assert.deepEqual(block.memoryRevisionIds, []);
  assert.deepEqual(block.factIds, []);
  assert.ok(edited.drafts[0].validation.warnings.some((warning) => warning.startsWith("human_note_unverified")));
  assert.equal(edited.revisions.at(-1)?.action, "saved");
});

test("reviewed report returns to draft after edit; final report is immutable", () => {
  const sources = reportSources();
  const snapshot = context(sources);
  const generated = generateReport(emptyReportState(), snapshot, new DemoReportGenerator(), now);
  const reviewed = reviewReport(generated.state, generated.draft.id, "actor-sales-a", "2026-09-23T12:02:00Z");
  assert.equal(reviewed.drafts[0].status, "reviewed");
  const fact = reviewed.drafts[0].sections.flatMap((section) => section.blocks)[0];
  const edited = editReportBlock(reviewed, generated.draft.id, fact.id, { zh: "备注", en: "Note" }, "2026-09-23T12:03:00Z");
  assert.equal(edited.drafts[0].status, "draft");
  const reReviewed = reviewReport(edited, generated.draft.id, "actor-sales-a", "2026-09-23T12:04:00Z");
  const finalized = finalizeReport(reReviewed, generated.draft.id, "actor-sales-a", "2026-09-23T12:05:00Z");
  assert.equal(finalized.final.syntheticData, true);
  assert.equal(finalized.state.drafts[0].status, "final");
  assert.throws(() => editReportBlock(finalized.state, generated.draft.id, fact.id, { zh: "改", en: "Edit" }, "2026-09-23T12:06:00Z"));
});

test("final snapshot stays unchanged after source edits and regeneration makes a new draft", () => {
  const sources = reportSources();
  const snapshot = context(sources);
  const generated = generateReport(emptyReportState(), snapshot, new DemoReportGenerator(), now);
  const reviewed = reviewReport(generated.state, generated.draft.id, "actor-sales-a", "2026-09-23T12:01:00Z");
  const finished = finalizeReport(reviewed, generated.draft.id, "actor-sales-a", "2026-09-23T12:02:00Z");
  const frozen = structuredClone(finished.final);
  sources.accounts.activities.find((item) => item.id === "activity-efc-call")!.title.zh = "Later source change";
  const newContext = context(sources, "daily", "2026-08-05", "context:regen");
  const regeneration = generateReport(finished.state, newContext, new DemoReportGenerator(), "2026-09-23T12:03:00Z", generated.draft.id);
  assert.deepEqual(regeneration.state.finals[0], frozen);
  assert.notEqual(regeneration.draft.id, generated.draft.id);
  assert.equal(regeneration.draft.status, "draft");
  assert.equal(regeneration.draft.revision, 2);
});

test("human note is visibly unverified and cannot inherit verified Fact status", () => {
  const sources = reportSources();
  const snapshot = context(sources);
  const generated = generateReport(emptyReportState(), snapshot, new DemoReportGenerator(), now);
  const changed = addReportHumanNote(generated.state, generated.draft.id, { zh: "需要人工核实", en: "Needs manual verification" }, "2026-09-23T12:01:00Z");
  const note = changed.drafts[0].sections.at(-1)!.blocks[0];
  assert.equal(note.kind, "human_note");
  assert.equal(note.origin, "human");
  assert.equal(note.validation, "needs_review");
  assert.equal(changed.drafts[0].validation.warnings.length, 1);
});

test("provenance validation blocks wrong Fact IDs, aggregates, and unknown task sources", () => {
  const sources = reportSources();
  const snapshot = context(sources, "weekly");
  const generated = generateReport(emptyReportState(), snapshot, new DemoReportGenerator(), now);
  const changed = structuredClone(generated.draft);
  const fact = changed.sections.flatMap((section) => section.blocks).find((block) => block.kind === "fact")!;
  fact.factIds.push("invented-fact");
  fact.aggregateCount = 999;
  const validation = validateReportDraft(changed, snapshot, now);
  assert.ok(validation.issues.some((issue) => issue.startsWith("unsupported_fact_reference")));
  assert.ok(validation.issues.some((issue) => issue.startsWith("aggregate_count_mismatch")));
  const recommendation = changed.sections.flatMap((section) => section.blocks).find((block) => block.kind === "recommendation");
  if (recommendation) {
    recommendation.actionSource = { provider: "trimflow", recordType: "task", recordId: "absent" };
    assert.ok(validateReportDraft(changed, snapshot, now).issues.some((issue) => issue.startsWith("unknown_existing_task")));
  }
});
