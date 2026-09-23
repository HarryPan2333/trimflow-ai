import test from "node:test";
import assert from "node:assert/strict";
import { createAccountState } from "../lib/accounts/repository";
import { projects, projectRequirements } from "../lib/mock-data";
import { createSampleWorkspace } from "../components/samples/sample-data";
import { createQuotationWorkspace } from "../components/quotations/quotation-data";
import { createDealRoomState } from "../lib/deal-room/repository";
import { createRoom, addMessage, addProposals, dismissProposal, reviewProposal } from "../lib/deal-room/commands";
import { applyReviewedProposal } from "../lib/deal-room/apply";
import { extractDemoSuggestions } from "../lib/deal-room/extraction";
import { validateProposalEvidence, validateProposalTarget } from "../lib/deal-room/validation";
import { getAccountRooms, getPendingProposalCount, getProjectRoom, getRoomMessages } from "../lib/deal-room/selectors";

const at = "2026-09-20T12:00:00Z";
const accounts = () => createAccountState();
const state = () => createDealRoomState();
const samples = () => createSampleWorkspace();
const context = (actorId: string) => ({ accounts: accounts(), projects, samples: samples(), actorId, at });
const reviewed = (id: string, actorId: string) => reviewProposal(state(), id, actorId, at, {});

test("rooms are bound to canonical Account and matching Project with explicit valid participants", () => {
  const base = state();
  assert.equal(getProjectRoom(base, 1)?.accountId, "client-nas");
  assert.equal(getAccountRooms(base, accounts(), "client-nas").length, 2);
  const room = { ...base.rooms[0], id: "room-new" };
  assert.throws(() => createRoom(base, { ...room, accountId: "client-efc" }, accounts(), projects));
  assert.throws(() => createRoom(base, { ...room, participantActorIds: ["missing-actor"] }, accounts(), projects));
  assert.throws(() => createRoom(base, room, accounts(), projects));
  assert.throws(() => createRoom(base, { ...room, accountId: "missing-account", projectId: undefined }, accounts(), projects));
});

test("messages require an authorized participant and same-room reply/attachment references", () => {
  const base = state();
  const valid = { ...base.messages[0], id: "message-new", createdAt: at };
  assert.equal(getRoomMessages(addMessage(base, valid, accounts()), valid.roomId).at(-1)?.id, valid.id);
  assert.equal(addMessage(base, { ...base.messages[0] }, accounts()), base);
  assert.throws(() => addMessage(base, { ...valid, authorActorId: "actor-sales-c" }, accounts()));
  assert.throws(() => addMessage(base, { ...valid, replyToMessageId: "message-efc-1" }, accounts()));
  assert.throws(() => addMessage(base, { ...valid, attachmentIds: ["attachment-efc-note"] }, accounts()));
});

test("proposals retain existing same-room message evidence and valid targets", () => {
  const base = state();
  const proposal = base.proposals.find((item) => item.id === "proposal-nas-price")!;
  if (proposal.proposalType !== "target_price") throw new Error("Fixture mismatch");
  assert.doesNotThrow(() => validateProposalEvidence(proposal, base));
  assert.doesNotThrow(() => validateProposalTarget(proposal, base, accounts(), projects, samples()));
  assert.throws(() => addProposals(base, [{ ...proposal, id: "bad-source", sourceMessageIds: ["message-efc-1"] }]));
  assert.throws(() => addProposals(base, [{ ...proposal, id: "no-source", sourceMessageIds: [] }]));
  assert.throws(() => validateProposalTarget({ ...proposal, target: { kind: "commercial_signal", projectId: 2 } }, base, accounts(), projects, samples()));
});

test("deterministic demo extraction produces controlled suggestions once, not business mutations", () => {
  const base = state();
  const message = { id: "message-new-price", roomId: "room-nas-project", authorActorId: "actor-sales-a", createdAt: at, kind: "customer_update" as const, content: { zh: "客户提到 USD 0.81、150,000 pcs，仅供讨论。", en: "Customer mentioned USD 0.81 at 150,000 pcs; discussion only." } };
  const withMessage = addMessage(base, message, accounts());
  const suggestions = extractDemoSuggestions(withMessage, message.roomId);
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].proposalType, "target_price");
  assert.deepEqual(suggestions[0].sourceMessageIds, [message.id]);
  assert.equal(withMessage.targetPriceSignals.length, 0);
  assert.equal(extractDemoSuggestions(addProposals(withMessage, suggestions), message.roomId).length, 0);
});

test("human review is mandatory; editing is retained; repeated Apply is idempotent", () => {
  const base = state();
  assert.throws(() => applyReviewedProposal(base, "proposal-nas-action", context("actor-sales-a")));
  assert.throws(() => reviewProposal(base, "proposal-nas-action", "actor-sales-c", at, {}));
  const review = reviewProposal(base, "proposal-nas-action", "actor-sales-a", at, { title: "Follow up on approved demo quotation" });
  assert.equal(review.proposals.find((item) => item.id === "proposal-nas-action")?.status, "reviewed");
  const first = applyReviewedProposal(review, "proposal-nas-action", context("actor-sales-a"));
  assert.equal(first.dealRoom.tasks.length, 1);
  assert.equal(first.dealRoom.tasks[0].title, "Follow up on approved demo quotation");
  assert.equal(first.dealRoom.tasks[0].accountId, "client-nas");
  assert.equal(first.dealRoom.tasks[0].projectId, 1);
  assert.deepEqual(first.dealRoom.tasks[0].sourceMessageIds, ["message-nas-3", "message-nas-4"]);
  assert.equal(first.dealRoom.proposals.find((item) => item.id === "proposal-nas-action")?.appliedTarget?.id, first.dealRoom.tasks[0].id);
  const again = applyReviewedProposal(first.dealRoom, "proposal-nas-action", context("actor-sales-a"));
  assert.equal(again.alreadyApplied, true);
  assert.equal(again.dealRoom.tasks.length, 1);
});

test("dismissed suggestions never Apply and preserve original discussion", () => {
  const base = state();
  const dismissed = dismissProposal(base, "proposal-nas-action", "actor-sales-a", at, "Not needed");
  assert.equal(dismissed.proposals.find((item) => item.id === "proposal-nas-action")?.status, "dismissed");
  assert.equal(dismissed.messages.length, base.messages.length);
  assert.throws(() => applyReviewedProposal(dismissed, "proposal-nas-action", context("actor-sales-a")));
  assert.throws(() => dismissProposal(dismissed, "proposal-nas-action", "actor-sales-a", at));
  assert.ok(getPendingProposalCount(dismissed, "room-nas-project") < getPendingProposalCount(base, "room-nas-project"));
});

test("Case A: V2 sample feedback keeps stable IDs and approved V3 intact", () => {
  const review = reviewed("proposal-nas-feedback", "actor-sales-a");
  const sampleState = samples();
  const current = structuredClone(sampleState.versions.find((item) => item.id === "SP-NAS-2407-V3"));
  const applied = applyReviewedProposal(review, "proposal-nas-feedback", { ...context("actor-sales-a"), samples: sampleState });
  assert.equal(applied.sampleFeedback?.sampleId, "SP-NAS-2407");
  assert.equal(applied.sampleFeedback?.sampleVersionId, "SP-NAS-2407-V2");
  assert.equal(applied.sampleFeedback?.receivedAt, "2026-08-06T09:05:00Z");
  assert.equal(applied.sampleFeedback?.resolvedInVersionId, "SP-NAS-2407-V3");
  assert.deepEqual(sampleState.versions.find((item) => item.id === "SP-NAS-2407-V3"), current);
  const tampered = review.proposals.find((item) => item.id === "proposal-nas-feedback")!;
  if (tampered.proposalType === "sample_feedback") tampered.extractedFields.sampleVersionId = "SP-EFC-2411-V1";
  assert.throws(() => applyReviewedProposal(review, "proposal-nas-feedback", { ...context("actor-sales-a"), samples: sampleState }));
});

test("Case A: customer target price is stored as a signal, formal quotation stays untouched", () => {
  const before = createQuotationWorkspace();
  const applied = applyReviewedProposal(reviewed("proposal-nas-price", "actor-sales-a"), "proposal-nas-price", context("actor-sales-a"));
  assert.equal(applied.dealRoom.targetPriceSignals[0].unitPrice, 0.82);
  assert.equal(applied.dealRoom.targetPriceSignals[0].quantity, 120000);
  assert.deepEqual(createQuotationWorkspace(), before);
  assert.equal(applied.dealRoom.proposals.find((item) => item.id === "proposal-nas-price")?.appliedTarget?.kind, "commercial_signal");
});

test("Case B: customer update and meeting summary become Account activities, not quotation changes", () => {
  const initialQuotes = createQuotationWorkspace();
  const first = applyReviewedProposal(reviewed("proposal-efc-update", "actor-sales-a"), "proposal-efc-update", context("actor-sales-a"));
  assert.equal(first.accounts.activities.at(-1)?.type, "customer_update");
  const secondReview = reviewProposal(first.dealRoom, "proposal-efc-meeting", "actor-sales-a", at, { openQuestions: "Final carton marks" });
  const second = applyReviewedProposal(secondReview, "proposal-efc-meeting", { ...context("actor-sales-a"), accounts: first.accounts });
  assert.equal(second.accounts.activities.at(-1)?.type, "meeting");
  assert.equal(second.accounts.activities.at(-1)?.detail.en.includes("Final carton marks"), true);
  assert.deepEqual(createQuotationWorkspace(), initialQuotes);
});

test("Case C: contact must be confirmed before referral; resulting Account network is linked", () => {
  const referral = reviewed("proposal-eyw-referral", "actor-sales-c");
  assert.throws(() => applyReviewedProposal(referral, "proposal-eyw-referral", context("actor-sales-c")));
  const contact = applyReviewedProposal(reviewed("proposal-eyw-contact", "actor-sales-c"), "proposal-eyw-contact", context("actor-sales-c"));
  assert.ok(contact.accounts.people.some((item) => item.id === "contact-deal-eyw-casey"));
  assert.ok(contact.accounts.affiliations.some((item) => item.contactId === "contact-deal-eyw-casey" && item.accountId === "client-eyw"));
  const afterReferral = applyReviewedProposal(referral, "proposal-eyw-referral", { ...context("actor-sales-c"), accounts: contact.accounts });
  assert.equal(afterReferral.accounts.referrals.at(-1)?.introducedContactId, "contact-deal-eyw-casey");
  assert.equal(afterReferral.accounts.referrals.at(-1)?.introducer.id, "contact-eyw-mia");
  assert.deepEqual(referral.proposals.find((item) => item.id === "proposal-eyw-referral")?.sourceMessageIds, ["message-eyw-1"]);
});

test("Case C: provisional requirement remains pending and original mock stays unchanged", () => {
  const original = structuredClone(projectRequirements.find((item) => item.id === "req-eyw-08"));
  const applied = applyReviewedProposal(reviewed("proposal-eyw-weight", "actor-sales-c"), "proposal-eyw-weight", context("actor-sales-c"));
  assert.equal(applied.dealRoom.requirements[0].id, "req-eyw-08");
  assert.equal(applied.dealRoom.requirements[0].status, "待确认");
  assert.equal(applied.dealRoom.requirements[0].sourceProposalId, "proposal-eyw-weight");
  assert.deepEqual(projectRequirements.find((item) => item.id === "req-eyw-08"), original);
});
