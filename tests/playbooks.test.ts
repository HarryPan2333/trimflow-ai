import test from "node:test";
import assert from "node:assert/strict";
import { createIssueWorkspace } from "../lib/issues/repository";
import { draftPlaybook, editPlaybook, publishPlaybook, reviewPlaybook } from "../lib/issues/playbook";
import { transitionIssue } from "../lib/issues/commands";

const at = "2026-08-05T12:00:00Z";
test("only a resolved issue can create a draft and no automatic publishing occurs", () => {
  const initial = createIssueWorkspace();
  assert.throws(() => draftPlaybook(initial, "IS-EFC-MARK-01", at), /resolved_issue_required/);
  const drafted = draftPlaybook(initial, "IS-NAS-COLOR-01", at);
  assert.equal(drafted.playbooks[0].status, "draft");
  assert.throws(() => publishPlaybook(drafted, drafted.playbooks[0].id, "actor-sales-a", at), /human_review_required/);
  assert.throws(() => draftPlaybook(drafted, "IS-NAS-COLOR-01", at), /active_playbook_exists/);
});

test("draft retains source issue, evidence, uncertainty and explicit involved people", () => {
  const initial = createIssueWorkspace(); const drafted = draftPlaybook(initial, "IS-NAS-COLOR-01", at); const playbook = drafted.playbooks[0];
  assert.deepEqual(playbook.sourceIssueIds, ["IS-NAS-COLOR-01"]);
  assert.ok(playbook.evidenceRefs.some((ref) => ref.recordId === "fb-nas-v1-01"));
  assert.equal(playbook.confirmedLessons.length, 0);
  assert.ok(playbook.suggestions.length > 0);
  assert.deepEqual(playbook.internalExpertActorIds, ["actor-sales-a"]);
});

test("editing resets review and publishing is single-use", () => {
  const drafted = draftPlaybook(createIssueWorkspace(), "IS-NAS-COLOR-01", at); const id = drafted.playbooks[0].id;
  const reviewed = reviewPlaybook(drafted, id, "actor-sales-b", at);
  assert.equal(reviewed.playbooks[0].reviewedByActorId, "actor-sales-b");
  const changed = editPlaybook(reviewed, id, { summary: { zh: "人工修订", en: "Human revision" } }, at);
  assert.equal(changed.playbooks[0].status, "draft");
  assert.equal(changed.playbooks[0].reviewedByActorId, undefined);
  const published = publishPlaybook(reviewPlaybook(changed, id, "actor-sales-b", at), id, "actor-sales-a", at);
  assert.equal(published.playbooks[0].status, "published");
  assert.throws(() => publishPlaybook(published, id, "actor-sales-a", at), /human_review_required/);
  const reopened = transitionIssue(reviewPlaybook(changed, id, "actor-sales-b", at), "IS-NAS-COLOR-01", "investigating", at, "actor-sales-a");
  assert.throws(() => publishPlaybook(reopened, id, "actor-sales-a", at), /resolved_source_required/);
});
