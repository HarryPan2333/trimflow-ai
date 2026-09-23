import test from "node:test";
import assert from "node:assert/strict";
import { createAccountState } from "../lib/accounts/repository";
import { addActivity, addCollaborator, addProspect, addReferral, addRelationship, claimAccount, recordDuplicateResolution, releaseOwnership, requestCollaboration, resolveCollaboration, transferOwnership } from "../lib/accounts/commands";
import { findDuplicateCandidates, normalizeAccountName } from "../lib/accounts/duplicates";
import { getActiveOwner, getAccountSourceIds, getEffectiveOwner, getFirstDiscovery, resolveCanonicalAccountId } from "../lib/accounts/selectors";
import { assertOwnershipIntervals, relationshipKey, validateProjectAccountReference } from "../lib/accounts/validation";
import { mergeAccounts } from "../lib/accounts/merge";
import { getAccountTimeline } from "../lib/accounts/timeline";
import { getAccountGraph } from "../lib/accounts/graph";
import { getLegacyClient, getLegacyContacts } from "../lib/accounts/legacy-adapter";
import { getAccountBusiness } from "../lib/accounts/aggregation";
import { createSampleWorkspace } from "../components/samples/sample-data";
import { createQuotationWorkspace } from "../components/quotations/quotation-data";
import { createOrderWorkspace } from "../components/orders/order-data";
import { mockProductLibraryRepository } from "../lib/product-library/repository";
import { projects, samples, quotations, purchaseOrders } from "../lib/mock-data";
import type { AccountState } from "../lib/accounts/types";

const scope = { accountId: "account-prospect" };
const meta = (id: string, at = "2026-09-01T00:00:00Z", actorId = "actor-sales-b") => ({ id, at, actorId });
const addedSource = (): AccountState => {
  const state = createAccountState();
  state.accounts.push({ ...state.accounts.find((item) => item.id === "account-prospect")!, id: "account-extra", code: "EXTRA-DEMO", name: "Independent Demo Brand", lifecycle: "active", revision: 1 });
  return state;
};

test("one active primary owner per account or office scope", () => {
  const state = claimAccount(createAccountState(), scope, meta("claim-1"));
  assert.equal(getActiveOwner(state, scope)?.ownerActorId, "actor-sales-b");
  assert.throws(() => claimAccount(state, scope, meta("claim-2", "2026-09-02T00:00:00Z", "actor-sales-c")));
  assertOwnershipIntervals(state);
});
test("ownership interval cannot end before it starts", () => {
  const state = claimAccount(createAccountState(), scope, meta("claim-interval"));
  assert.throws(() => releaseOwnership(state, scope, meta("release-early", "2026-08-01T00:00:00Z")));
});
test("claim of unassigned prospect succeeds and is idempotent", () => {
  const state = claimAccount(createAccountState(), scope, meta("claim-idem"));
  assert.equal(claimAccount(state, scope, meta("claim-idem")), state);
  assert.equal(state.ownerships.filter((item) => item.scope.accountId === scope.accountId && !item.endedAt).length, 1);
});
test("transfer closes old interval and does not change project owner", () => {
  const original = createAccountState(); const before = getFirstDiscovery(original, "client-efc");
  const state = transferOwnership(original, { accountId: "client-efc" }, "actor-sales-c", meta("transfer-efc", "2026-09-10T00:00:00Z", "actor-sales-a"));
  assert.equal(getActiveOwner(state, { accountId: "client-efc" })?.ownerActorId, "actor-sales-c");
  assert.equal(state.ownerships.find((item) => item.id === "own-efc")?.endedAt, "2026-09-10T00:00:00Z");
  assert.deepEqual(getFirstDiscovery(state, "client-efc"), before);
  assert.equal(projects.find((item) => item.id === 2)?.ownerActorId, "actor-sales-b");
});
test("release leaves scope unassigned and preserves history", () => {
  const state = releaseOwnership(createAccountState(), { accountId: "client-eyw" }, meta("release-eyw", "2026-09-10T00:00:00Z", "actor-sales-c"));
  assert.equal(getActiveOwner(state, { accountId: "client-eyw" }), undefined);
  assert.equal(state.ownerships.find((item) => item.id === "own-eyw")?.endedAt, "2026-09-10T00:00:00Z");
});
test("office-specific owner overrides inheritance; unassigned office inherits account", () => {
  const state = createAccountState();
  assert.equal(getEffectiveOwner(state, { accountId: "client-nas", officeId: "office-nas-hk" }).assignment?.ownerActorId, "actor-sales-b");
  assert.equal(getEffectiveOwner(state, { accountId: "client-nas", officeId: "office-nas-ny" }).assignment?.ownerActorId, "actor-sales-a");
  assert.equal(getEffectiveOwner(state, { accountId: "client-nas", officeId: "office-nas-ny" }).inherited, true);
});
test("collaboration request requires owner approval before membership", () => {
  const state = createAccountState();
  const asked = requestCollaboration(state, { accountId: "client-efc" }, "Help with demo sourcing", meta("request-new", "2026-09-11T00:00:00Z", "actor-sales-c"));
  assert.equal(asked.memberships.some((item) => item.actorId === "actor-sales-c" && item.scope.accountId === "client-efc"), false);
  assert.throws(() => resolveCollaboration(asked, "request-new", "accepted", meta("accept-wrong", "2026-09-12T00:00:00Z", "actor-sales-b")));
  const accepted = resolveCollaboration(asked, "request-new", "accepted", meta("accept-ok", "2026-09-12T00:00:00Z", "actor-sales-a"));
  assert.equal(accepted.memberships.filter((item) => item.actorId === "actor-sales-c" && !item.endedAt).length, 1);
});
test("duplicate collaboration command is idempotent", () => {
  const state = requestCollaboration(createAccountState(), { accountId: "client-efc" }, "Demo assistance", meta("request-repeat", "2026-09-11T00:00:00Z", "actor-sales-c"));
  assert.equal(requestCollaboration(state, { accountId: "client-efc" }, "Demo assistance", meta("request-repeat", "2026-09-11T00:00:00Z", "actor-sales-c")), state);
  assert.throws(() => requestCollaboration(state, { accountId: "client-efc" }, "Demo assistance", meta("request-other", "2026-09-12T00:00:00Z", "actor-sales-c")));
});
test("primary owner is not editable as duplicate collaborator", () => {
  const state = createAccountState();
  assert.throws(() => addCollaborator(state, { accountId: "client-nas" }, "actor-sales-a", ["sales"], meta("team-owner", "2026-09-11T00:00:00Z", "actor-sales-a")));
});
test("relationship normalization prevents A-B and B-A duplicates", () => {
  const state = createAccountState();
  const first = { id: "r-new", from: { kind: "actor" as const, id: "actor-sales-a" }, to: { kind: "contact" as const, id: "contact-nas-olivia" }, type: "knows" as const };
  const next = addRelationship(state, first);
  assert.equal(relationshipKey(first), relationshipKey({ ...first, from: first.to, to: first.from }));
  assert.equal(next.relationships.at(-1)?.from.kind, "actor");
  assert.throws(() => addRelationship(next, { ...first, id: "r-reversed", from: first.to, to: first.from }));
});
test("invalid relationship endpoints and strength are rejected", () => {
  const state = createAccountState();
  assert.throws(() => addRelationship(state, { id: "bad", from: { kind: "actor", id: "missing" }, to: { kind: "contact", id: "contact-nas-olivia" }, type: "knows" }));
  assert.throws(() => addRelationship(state, { id: "bad-strength", from: { kind: "actor", id: "actor-sales-a" }, to: { kind: "contact", id: "contact-nas-olivia" }, type: "influences", strength: "strong" }));
});
test("referral keeps three distinct parties and validates affiliation", () => {
  const state = createAccountState();
  assert.equal(state.referrals[0].introducer.kind, "contact");
  assert.equal(state.referrals[0].recipient.kind, "actor");
  assert.throws(() => addReferral(state, { ...state.referrals[0], id: "bad-referral", introducer: { kind: "contact", id: "contact-eyw-noah" } }, meta("bad-referral-event")));
});
test("duplicate matching explains identity signals without percentages", () => {
  const state = createAccountState();
  const candidates = findDuplicateCandidates(state, { name: "NAS Demo Brand", aliases: [], domains: ["https://nas.example.com"], country: "United States" });
  assert.equal(candidates[0].accountId, "client-nas");
  assert.equal(candidates[0].confidence, "high");
  assert.ok(candidates[0].signals.includes("alias"));
  assert.ok(candidates[0].signals.includes("hostname"));
  assert.ok(candidates[0].reasons.every((item) => item.zh && item.en));
  assert.equal(normalizeAccountName("  Demo—Brand  "), normalizeAccountName("demo brand"));
});
test("duplicate detection does not use shared contact email domain", () => {
  const state = createAccountState();
  const candidates = findDuplicateCandidates(state, { name: "Unrelated Demo Entity", aliases: [], domains: ["unrelated.example.com"], country: "Atlantis" });
  assert.equal(candidates.length, 0);
});
test("self merge and canonical merge cycle are rejected", () => {
  const state = createAccountState();
  const record = { id: "merge-invalid", sourceAccountIds: ["client-nas"], targetAccountId: "client-nas", ownershipResolution: { ownerActorId: "actor-sales-a", reason: "explicit" }, fieldConflictSelections: {}, mergedByActorId: "actor-sales-a", mergedAt: "2026-09-20" };
  assert.throws(() => mergeAccounts(state, record));
  const loop = structuredClone(state);
  loop.accounts.find((item) => item.id === "client-nas")!.recordStatus = "merged";
  loop.accounts.find((item) => item.id === "client-nas")!.canonicalAccountId = "account-nas-duplicate";
  assert.throws(() => resolveCanonicalAccountId(loop, "client-nas"));
});
test("cross-workspace merge is rejected", () => {
  const state = addedSource(); state.accounts.find((item) => item.id === "account-extra")!.workspaceId = "other" as "demo";
  assert.throws(() => mergeAccounts(state, { id: "cross", sourceAccountIds: ["account-extra"], targetAccountId: "client-nas", ownershipResolution: { ownerActorId: "actor-sales-a", reason: "explicit" }, fieldConflictSelections: {}, mergedByActorId: "actor-sales-a", mergedAt: "2026-09-20" }));
});
test("canonical resolver retains merged source IDs", () => {
  const state = createAccountState();
  assert.equal(resolveCanonicalAccountId(state, "account-nas-duplicate"), "client-nas");
  assert.deepEqual(getAccountSourceIds(state, "client-nas").sort(), ["account-nas-duplicate", "client-nas"]);
});
test("first discovery survives ownership changes and account merge", () => {
  const initial = addedSource();
  initial.discoveries.push({ id: "discovery-extra", accountId: "account-extra", discoveredByActorId: "actor-sales-b", discoveredAt: "2026-01-01", sourceType: "market_research", sourceDetail: { zh: "演示", en: "Demo" }, recordedByActorId: "actor-sales-b", recordedAt: "2026-01-02" });
  const merged = mergeAccounts(initial, { id: "merge-extra", sourceAccountIds: ["account-extra"], targetAccountId: "client-nas", ownershipResolution: { ownerActorId: "actor-sales-a", reason: "Keep existing owner" }, fieldConflictSelections: {}, mergedByActorId: "actor-sales-a", mergedAt: "2026-09-20" });
  assert.equal(getFirstDiscovery(merged, "client-nas")?.id, "discovery-extra");
  assert.equal(merged.discoveries.find((item) => item.id === "discovery-extra")?.accountId, "account-extra");
});
test("merge preserves project, sample, quote, PO and product snapshots", () => {
  const state = addedSource();
  const commercialBefore = structuredClone({ projects, samples, quotations, purchaseOrders, projectProducts: mockProductLibraryRepository.load().projectProducts });
  const merged = mergeAccounts(state, { id: "merge-history", sourceAccountIds: ["account-extra"], targetAccountId: "client-nas", ownershipResolution: { ownerActorId: "actor-sales-a", reason: "Explicit current owner" }, fieldConflictSelections: {}, mergedByActorId: "actor-sales-a", mergedAt: "2026-09-20" });
  assert.equal(merged.accounts.find((item) => item.id === "account-extra")?.recordStatus, "merged");
  assert.deepEqual({ projects, samples, quotations, purchaseOrders, projectProducts: mockProductLibraryRepository.load().projectProducts }, commercialBefore);
  assert.equal(merged.merges.at(-1)?.sourceAccountIds[0], "account-extra");
});
test("legacy adapter resolves canonical client and new contacts", () => {
  const state = createAccountState();
  assert.equal(getLegacyClient(state, "account-nas-duplicate")?.id, "client-nas");
  assert.ok(getLegacyContacts(state, "client-nas").some((item) => item.id === "contact-nas-design"));
});
test("new project requires real canonical account; prospect command provides it", () => {
  const state = createAccountState();
  assert.throws(() => validateProjectAccountReference(state, { clientId: "client-new-dangling" }));
  const account = { ...state.accounts.find((item) => item.id === "account-prospect")!, id: "account-new-test", code: "PR-TEST", name: "Synthetic Prospect", revision: 1 };
  const next = addProspect(state, account, { id: "discovery-new", accountId: account.id, discoveredByActorId: "actor-sales-b", discoveredAt: "2026-09-20", sourceType: "market_research", sourceDetail: { zh: "演示", en: "Demo" }, recordedByActorId: "actor-sales-b", recordedAt: "2026-09-20" }, meta("prospect-event", "2026-09-20"));
  assert.doesNotThrow(() => validateProjectAccountReference(next, { clientId: account.id }));
});
test("account activity and project timeline are read-projected together", () => {
  const state = addActivity(createAccountState(), { id: "note-new", accountId: "client-nas", type: "shared_note", title: { zh: "演示备注", en: "Demo note" }, detail: { zh: "资料", en: "Details" }, occurredAt: "2026-09-20", actorId: "actor-sales-a" });
  const timeline = getAccountTimeline(state, "client-nas");
  assert.ok(timeline.some((item) => item.id === "note-new"));
  assert.ok(timeline.some((item) => item.source === "project"));
  assert.equal(state.activities.length + state.events.length < timeline.length, true);
});
test("graph DTO includes derived office, brand group and contact links", () => {
  const state = createAccountState();
  const graph = getAccountGraph(state, "client-efc");
  assert.ok(graph.nodes.some((item) => item.kind === "group"));
  assert.ok(graph.edges.some((item) => item.type === "brand"));
  assert.ok(graph.edges.some((item) => item.type === "affiliated"));
  assert.ok(graph.edges.some((item) => item.type === "primary_owner"));
});
test("aggregation derives business stages from stable existing IDs", () => {
  const state = createAccountState();
  const data = getAccountBusiness(state, "client-efc", projects, mockProductLibraryRepository.load(), createSampleWorkspace(), createQuotationWorkspace(), createOrderWorkspace());
  assert.equal(data.projects.length, 1);
  assert.ok(data.samples.length >= 1);
  assert.ok(data.quotations.length >= 1);
  assert.ok(data.orders.length >= 1);
});
test("duplicate resolution records decision and versions without merging", () => {
  const state = createAccountState();
  const next = recordDuplicateResolution(state, { id: "resolution-test", candidateAccountIds: ["client-nas"], proposedName: "NAS Demo Brand", signals: ["alias"], recordVersions: { "client-nas": 1 }, decision: "use_existing", reason: "Same fictional brand", resolvedByActorId: "actor-sales-b", resolvedAt: "2026-09-20" });
  assert.equal(next.duplicateResolutions.at(-1)?.decision, "use_existing");
  assert.equal(next.accounts.find((item) => item.id === "client-nas")?.recordStatus, "canonical");
});
test("keep-separate duplicate decision becomes a typed account event", () => {
  const state = addedSource();
  const next = recordDuplicateResolution(state, { id: "resolution-separate", candidateAccountIds: ["client-nas", "account-extra"], signals: ["country"], recordVersions: { "client-nas": 1, "account-extra": 1 }, decision: "keep_separate", reason: "Different fictional legal entity", resolvedByActorId: "actor-sales-b", resolvedAt: "2026-09-20" });
  assert.ok(next.events.some((event) => event.type === "separate_account_confirmed" && event.accountId === "account-extra"));
});
