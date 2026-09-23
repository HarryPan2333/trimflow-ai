"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { PageHeader } from "../layout/page-header";
import { useI18n } from "../providers/language-provider";
import { Badge, Button, Card } from "../ui/primitives";
import type { AccountState } from "../../lib/accounts/types";
import { getActorName, getAccountTeam } from "../../lib/accounts/selectors";
import type { Project } from "../../lib/mock-data";
import type { SampleWorkspace } from "../samples/sample-data";
import type { QuotationWorkspace } from "../quotations/quotation-data";
import type { BusinessExtractionProposal, DealRoomState, ProposalReviewEdits } from "../../lib/deal-room/types";
import { addMessage, addProposals, dismissProposal, reviewProposal } from "../../lib/deal-room/commands";
import { extractDemoSuggestions } from "../../lib/deal-room/extraction";
import { getAccountRooms, getRoomMessages, getRoomProposals } from "../../lib/deal-room/selectors";

const typeKeys = {
  customer_update: "deal.customerUpdate", requirement_update: "deal.requirementUpdate", sample_feedback: "deal.sampleFeedback",
  target_price: "deal.targetPrice", next_action: "deal.nextAction", contact_update: "deal.contactUpdate",
  relationship_update: "deal.relationshipUpdate", meeting_summary: "deal.meetingSummary",
} as const;
const statusKeys = { suggested: "deal.suggested", reviewed: "deal.reviewed", applied: "deal.applied", dismissed: "deal.dismissed" } as const;
const confidenceKeys = { clear: "deal.clear", needs_review: "deal.needsReview", ambiguous: "deal.ambiguous" } as const;
const fieldKeys = {
  summary: "deal.summary", value: "deal.value", note: "deal.note", requestedChange: "deal.requestedChange",
  unitPrice: "deal.unitPrice", quantity: "deal.quantity", context: "deal.priceContext", title: "deal.taskTitle",
  dueDate: "deal.dueDate", ownerActorId: "deal.ownerActorId", name: "deal.contactName", jobTitle: "deal.jobTitle", keyUpdates: "deal.keyUpdates",
  customerRequirements: "deal.customerRequirements", commercialSignals: "deal.commercialSignals", sampleChanges: "deal.sampleChanges",
  nextActions: "deal.nextActions", openQuestions: "deal.openQuestions",
} as const;

export function DealRoomWorkspace({ state, accounts, projects, samples, quotations, roomId, onRoomChange, onBack, onAccount, onProject, run, onApply }: {
  state: DealRoomState; accounts: AccountState; projects: Project[]; samples: SampleWorkspace; quotations: QuotationWorkspace;
  roomId: string; onRoomChange: (id: string) => void; onBack: () => void; onAccount: (id: string) => void; onProject: (project: Project) => void;
  run: (command: (state: DealRoomState) => DealRoomState, success: string) => boolean; onApply: (proposalId: string, actorId: string) => boolean;
}) {
  const { language, t, text, label, formatDate } = useI18n();
  const room = state.rooms.find((item) => item.id === roomId);
  const [actorId, setActorId] = useState(room?.participantActorIds[0] ?? "");
  const [kind, setKind] = useState<"text" | "customer_update" | "meeting_note" | "sample_feedback" | "internal_note">("text");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  if (!room) return <Card><p>{t("deal.emptyMessages")}</p><Button onClick={onBack}>{t("deal.back")}</Button></Card>;
  const account = accounts.accounts.find((item) => item.id === room.accountId);
  const project = projects.find((item) => item.id === room.projectId);
  const rooms = getAccountRooms(state, accounts, room.accountId);
  const messages = getRoomMessages(state, room.id);
  const proposals = getRoomProposals(state, room.id);
  const selected = proposals.find((item) => item.id === selectedId) ?? proposals[0];
  const linkedSamples = samples.samples.filter((item) => item.projectId === room.projectId);
  const latestSample = linkedSamples.at(-1);
  const linkedQuotes = quotations.quotations.filter((item) => item.projectId === room.projectId);
  const latestQuote = linkedQuotes.at(-1);
  const team = getAccountTeam(accounts, room.accountId);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    const now = new Date().toISOString();
    const ok = run((current) => addMessage(current, { id: `message-local-${crypto.randomUUID()}`, roomId: room.id, authorActorId: actorId, createdAt: now, kind, content: { zh: draft.trim(), en: draft.trim() }, replyToMessageId: replyTo, businessContextRefs: room.projectId ? [{ kind: "project", id: String(room.projectId) }] : [{ kind: "account", id: room.accountId }] }, accounts), t("deal.sent"));
    if (ok) { setDraft(""); setReplyTo(undefined); }
  };
  const extract = () => {
    const generated = extractDemoSuggestions(state, room.id);
    run((current) => addProposals(current, generated), generated.length ? t("deal.extracted") : t("deal.noneExtracted"));
    if (generated.length) setSelectedId(generated[0].id);
  };
  return <div className="deal-workspace">
    <button className="back-link" onClick={onBack}>‹ {t("deal.back")}</button>
    <PageHeader title={t("deal.title")} subtitle={t("deal.subtitle")} actions={<Badge tone="blue">DEMO / {t("deal.rooms")}</Badge>} />
    <div className="deal-notice"><span>✦</span><span>{t("deal.demo")} {t("deal.noAuto")}</span></div>
    <div className="deal-grid">
      <aside className="deal-context">
        <Card><h2>{t("deal.rooms")}</h2><div className="deal-room-picker">{rooms.map((item) => <button key={item.id} className={item.id === room.id ? "active" : ""} onClick={() => onRoomChange(item.id)}><span>◎</span><strong>{text(item.title)}</strong><small>{state.proposals.filter((p) => p.roomId === item.id && (p.status === "suggested" || p.status === "reviewed")).length}</small></button>)}</div></Card>
        <Card><h2>{t("deal.context")}</h2><dl className="deal-facts"><div><dt>{t("deal.relatedAccount")}</dt><dd><button onClick={() => onAccount(room.accountId)}>{account?.name ?? room.accountId} ↗</button></dd></div><div><dt>{t("deal.accountOwner")}</dt><dd>{getActorName(accounts, team.owner?.ownerActorId, language)}</dd></div><div><dt>{t("deal.relatedProject")}</dt><dd>{project ? <button onClick={() => onProject(project)}>{project.code} ↗</button> : t("deal.noProject")}</dd></div>{project && <><div><dt>{t("deal.projectOwner")}</dt><dd>{text(project.owner)}</dd></div><div><dt>{t("common.product")}</dt><dd>{text(project.product)}</dd></div><div><dt>{t("common.status")}</dt><dd>{label(project.stage)}</dd></div><div><dt>{t("deal.nextStep")}</dt><dd>{text(project.next)}</dd></div><div><dt>{t("deal.sampleStatus")}</dt><dd>{latestSample ? `${latestSample.id} · ${label(latestSample.status)}` : "—"}</dd></div><div><dt>{t("deal.quoteStatus")}</dt><dd>{latestQuote ? `${latestQuote.id} · ${label(latestQuote.status)}` : "—"}</dd></div></>}</dl><h3>{t("deal.participants")}</h3><div className="deal-people">{room.participantActorIds.map((id) => <span key={id}>{getActorName(accounts, id, language)}</span>)}</div></Card>
      </aside>
      <section className="deal-conversation"><Card><div className="deal-section-head"><div><small>{project?.code ?? account?.code}</small><h2>{text(room.title)}</h2></div><Badge>{messages.length} {t("deal.messages")}</Badge></div><div className="deal-message-list">{messages.length ? messages.map((message) => <article key={message.id} className="deal-message"><div className="deal-avatar">{getActorName(accounts, message.authorActorId, language).slice(-1)}</div><div><div className="deal-message-meta"><strong>{getActorName(accounts, message.authorActorId, language)}</strong><span>{formatDate(message.createdAt)} · {message.createdAt.slice(11,16)}</span><Badge>{t(message.kind === "text" ? "deal.text" : message.kind === "internal_note" ? "deal.internalNote" : message.kind === "meeting_note" ? "deal.meetingNote" : message.kind === "system_event" ? "deal.systemEvent" : message.kind === "sample_feedback" ? "deal.sampleFeedback" : "deal.customerUpdate")}</Badge></div>{message.replyToMessageId && <small className="deal-reply-ref">↳ {messages.find((item) => item.id === message.replyToMessageId)?.content[language].slice(0, 64)}</small>}<p>{text(message.content)}</p>{message.attachmentIds?.map((id) => { const asset = state.attachments.find((item) => item.id === id); return asset && <div className="deal-attachment" key={id}><Image src={asset.assetPath} alt="" width={44} height={34} unoptimized /><span><strong>{text(asset.title)}</strong><small>{t("deal.attachment")}</small></span></div>; })}<button className="deal-reply-button" onClick={() => setReplyTo(message.id)}>↳ {t("deal.reply")}</button></div></article>) : <p>{t("deal.emptyMessages")}</p>}</div><form className="deal-composer" onSubmit={submit}><div className="deal-composer-tools"><label>{t("deal.actor")}<select value={actorId} onChange={(event) => setActorId(event.target.value)}>{room.participantActorIds.map((id) => <option key={id} value={id}>{getActorName(accounts, id, language)}</option>)}</select></label><label>{t("deal.kind")}<select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="text">{t("deal.text")}</option><option value="customer_update">{t("deal.customerUpdate")}</option><option value="meeting_note">{t("deal.meetingNote")}</option><option value="sample_feedback">{t("deal.sampleFeedback")}</option><option value="internal_note">{t("deal.internalNote")}</option></select></label></div>{replyTo && <button className="deal-reply-ref" type="button" onClick={() => setReplyTo(undefined)}>↳ {messages.find((item) => item.id === replyTo)?.content[language].slice(0, 60)} ×</button>}<textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t("deal.messagePlaceholder")} rows={3} required /><div className="deal-composer-footer"><small>{t("deal.readOnly")}</small><Button type="submit">{t("deal.send")} →</Button></div></form></Card></section>
      <aside className="deal-suggestion-col"><Card><div className="deal-section-head"><div><small>BUSINESS EXTRACTION</small><h2>{t("deal.suggestions")}</h2></div><Button variant="secondary" onClick={extract}>✦ {t("deal.extract")}</Button></div><p className="deal-help">{t("deal.noAuto")}</p><div className="deal-proposal-list">{proposals.length ? proposals.map((proposal) => <button key={proposal.id} className={selected?.id === proposal.id ? "active" : ""} onClick={() => setSelectedId(proposal.id)}><span><strong>{t(typeKeys[proposal.proposalType])}</strong><Badge tone={proposal.status === "applied" ? "green" : proposal.status === "dismissed" ? "neutral" : "amber"}>{t(statusKeys[proposal.status])}</Badge></span><small>{t(confidenceKeys[proposal.confidenceState])} · {t("deal.sourceCount", { count: proposal.sourceMessageIds.length })}</small></button>) : <p>{t("deal.emptySuggestions")}</p>}</div></Card>{selected && <ProposalReview key={selected.id} proposal={selected} state={state} accounts={accounts} actorId={actorId} run={run} onApply={onApply} />}</aside>
    </div>
  </div>;
}

function ProposalReview({ proposal, state, accounts, actorId, run, onApply }: {
  proposal: BusinessExtractionProposal; state: DealRoomState; accounts: AccountState; actorId: string;
  run: (command: (state: DealRoomState) => DealRoomState, success: string) => boolean; onApply: (proposalId: string, actorId: string) => boolean;
}) {
  const { language, t, text } = useI18n();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(proposal.extractedFields).map(([key, value]) => [key, String(value)])));
  const [dirty, setDirty] = useState(false);
  const [dismissReason, setDismissReason] = useState("");
  const immutable = new Set(["sampleId", "sampleVersionId", "resolvedInVersionId", "requirementId", "contactId", "functionTag", "unit", "currency", "introducerContactId", "introducedContactId", "recipientActorId"]);
  const editable = Object.entries(values).filter(([key]) => !immutable.has(key));
  const review = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const edits: ProposalReviewEdits = {};
    for (const [key, value] of editable) {
      if (key === "unitPrice" || key === "quantity") Object.assign(edits, { [key]: Number(value) });
      else Object.assign(edits, { [key]: value });
    }
    if (run((current) => reviewProposal(current, proposal.id, actorId, new Date().toISOString(), edits), t("deal.reviewSaved"))) setDirty(false);
  };
  return <Card className="deal-review"><div className="deal-section-head"><div><small>{proposal.id}</small><h2>{t("deal.review")}</h2></div><Badge tone={proposal.status === "applied" ? "green" : "amber"}>{t(statusKeys[proposal.status])}</Badge></div><p className="deal-help">{t("deal.editHelp")}</p><div className="deal-evidence"><strong>{t("deal.evidence")}</strong>{proposal.sourceMessageIds.map((id) => { const message = state.messages.find((item) => item.id === id); return message && <blockquote key={id}><small>{getActorName(accounts, message.authorActorId, language)} · {message.createdAt.slice(0,10)}</small><p>{text(message.content)}</p></blockquote>; })}</div><div className="deal-target"><strong>{t("deal.target")}</strong><span>{t(`deal.target.${proposal.target.kind}`)} · {"projectId" in proposal.target ? proposal.target.projectId : "accountId" in proposal.target ? proposal.target.accountId : proposal.target.sampleId}</span></div><form onSubmit={review}><div className="deal-review-fields">{editable.map(([key, value]) => <label key={key}>{key in fieldKeys ? t(fieldKeys[key as keyof typeof fieldKeys]) : key}{key === "ownerActorId" ? <select value={value} onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value })); setDirty(true); }}><option value="">—</option>{accounts.actors.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{text(item.displayName)}</option>)}</select> : key === "summary" || key === "context" || key === "requestedChange" || key === "keyUpdates" || key === "customerRequirements" || key === "commercialSignals" || key === "sampleChanges" || key === "nextActions" || key === "openQuestions" ? <textarea rows={2} value={value} onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value })); setDirty(true); }} /> : <input type={key === "unitPrice" || key === "quantity" ? "number" : key === "dueDate" ? "date" : "text"} step={key === "unitPrice" ? "0.0001" : undefined} min={key === "unitPrice" ? "0.0001" : key === "quantity" ? "1" : undefined} value={value} onChange={(event) => { setValues((current) => ({ ...current, [key]: event.target.value })); setDirty(true); }} />}</label>)}</div>{proposal.proposalType === "target_price" && <p className="deal-price-warning">{t("deal.targetCaution")}</p>}{proposal.status !== "applied" && proposal.status !== "dismissed" && <label className="deal-dismiss-reason">{t("deal.dismissReason")}<input value={dismissReason} onChange={(event) => setDismissReason(event.target.value)} /></label>}<div className="deal-review-actions">{proposal.status !== "applied" && proposal.status !== "dismissed" && <><Button type="submit" variant="secondary">{t("deal.saveReview")}</Button><Button type="button" disabled={proposal.status !== "reviewed" || dirty} onClick={() => onApply(proposal.id, actorId)}>{t("deal.apply")}</Button><Button type="button" variant="ghost" onClick={() => run((current) => dismissProposal(current, proposal.id, actorId, new Date().toISOString(), dismissReason.trim() || undefined), t("deal.dismissSaved"))}>{t("deal.dismiss")}</Button></>}</div></form>{proposal.appliedTarget && <p className="deal-applied">✓ {t("deal.appliedTo")}: {t(`deal.target.${proposal.appliedTarget.kind}`)} · {proposal.appliedTarget.id}</p>}</Card>;
}
