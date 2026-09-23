"use client";

import { useState } from "react";
import { PageHeader } from "../layout/page-header";
import { Badge, Button, Card, Modal } from "../ui/primitives";
import { useI18n } from "../providers/language-provider";
import { findDuplicateCandidates } from "../../lib/accounts/duplicates";
import { getAccountBusiness } from "../../lib/accounts/aggregation";
import { getActiveOwner, getActorName, getCanonicalAccounts } from "../../lib/accounts/selectors";
import { getAccountTimeline } from "../../lib/accounts/timeline";
import { DuplicateReview, type AccountBusinessContext } from "./duplicate-review";
import type { Account, AccountState, DuplicateCandidate, DuplicateResolution } from "../../lib/accounts/types";

export type ProspectInput = { name: string; country: string; region: string; kind: Account["kind"]; domain: string };

export function AccountCenter({ state, business, onOpen, onCreate, onResolve, onRequest, showToast }: {
  state: AccountState; business: AccountBusinessContext; onOpen: (id: string, tab?: "overview" | "contacts" | "ownership") => void;
  onCreate: (input: ProspectInput, actorId: string) => string;
  onResolve: (candidateIds: string[], decision: DuplicateResolution["decision"], reason: string, signals?: DuplicateResolution["signals"], proposedName?: string, actorId?: string) => void;
  onRequest: (accountId: string, actorId: string) => boolean;
  showToast: (message: string) => void;
}) {
  const { language, t, text, label } = useI18n();
  const [query, setQuery] = useState("");
  const [lifecycle, setLifecycle] = useState("all");
  const [owner, setOwner] = useState("all");
  const [country, setCountry] = useState("all");
  const [unassigned, setUnassigned] = useState(false);
  const [prospects, setProspects] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [input, setInput] = useState<ProspectInput>({ name: "", country: "", region: "", kind: "brand", domain: "" });
  const [candidates, setCandidates] = useState<DuplicateCandidate[] | null>(null);
  const [actorId, setActorId] = useState("actor-sales-b");
  const accounts = getCanonicalAccounts(state);
  const countries = [...new Set(accounts.map((item) => item.country))].sort();
  const filtered = accounts.filter((account) => {
    const activeOwner = getActiveOwner(state, { accountId: account.id })?.ownerActorId;
    return `${account.name} ${account.code} ${account.aliases.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()) && (lifecycle === "all" || account.lifecycle === lifecycle) && (owner === "all" || activeOwner === owner) && (country === "all" || account.country === country) && (!unassigned || !activeOwner) && (!prospects || account.lifecycle === "prospect");
  });
  const reset = () => { setCreateOpen(false); setCandidates(null); setInput({ name: "", country: "", region: "", kind: "brand", domain: "" }); };
  const create = (reason?: string) => {
    try {
      if (candidates?.length && !reason) throw new Error(t("account.keepReason"));
      const id = onCreate(input, actorId);
      if (candidates?.length) onResolve([...candidates.map((item) => item.accountId), id], "keep_separate", reason!, [...new Set(candidates.flatMap((item) => item.signals))], input.name, actorId);
      reset(); onOpen(id);
    } catch (error) { showToast(t("account.failure", { reason: error instanceof Error ? error.message : String(error) })); }
  };
  const request = (accountId: string) => { if (onRequest(accountId, actorId)) onResolve([accountId], "request_collaboration", "Demo collaboration requested after duplicate review", candidates?.find((item) => item.accountId === accountId)?.signals, input.name, actorId); };
  return <div className="account-center">
    <PageHeader title={t("account.center")} subtitle={t("account.centerSubtitle")} actions={<Button onClick={() => setCreateOpen(true)}>＋ {t("account.create")}</Button>} />
    <Card className="account-filter-panel"><label className="account-search">⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("account.search")} /></label><select aria-label={t("account.lifecycle")} value={lifecycle} onChange={(event) => setLifecycle(event.target.value)}><option value="all">{t("common.all")}</option>{(["prospect", "active", "dormant", "disqualified"] as const).map((item) => <option key={item} value={item}>{t(`account.${item}`)}</option>)}</select><select aria-label={t("account.owner")} value={owner} onChange={(event) => setOwner(event.target.value)}><option value="all">{t("common.all")}</option>{state.actors.filter((item) => item.functionTags.includes("sales")).map((item) => <option key={item.id} value={item.id}>{text(item.displayName)}</option>)}</select><select aria-label={t("account.country")} value={country} onChange={(event) => setCountry(event.target.value)}><option value="all">{t("common.all")}</option>{countries.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select><label className="account-check"><input type="checkbox" checked={unassigned} onChange={(event) => setUnassigned(event.target.checked)} />{t("account.unassigned")}</label><label className="account-check"><input type="checkbox" checked={prospects} onChange={(event) => setProspects(event.target.checked)} />{t("account.prospects")}</label></Card>
    <div className="account-card-grid">{filtered.map((account) => {
      const businessData = getAccountBusiness(state, account.id, business.projects, business.products, business.samples, business.quotations, business.orders);
      const ownerAssignment = getActiveOwner(state, { accountId: account.id });
      const members = state.memberships.filter((item) => item.scope.accountId === account.id && !item.endedAt);
      const latest = getAccountTimeline(state, account.id)[0];
      return <button className="account-card card" key={account.id} onClick={() => onOpen(account.id)}><div className="account-card-heading"><span className="eyebrow">{account.code}</span><Badge tone={account.lifecycle === "prospect" ? "amber" : "blue"}>{t(`account.${account.lifecycle}`)}</Badge></div><h2>{account.name}</h2><p>{label(account.region)} · {label(account.country)}</p><dl><div><dt>{t("account.owner")}</dt><dd>{getActorName(state, ownerAssignment?.ownerActorId, language)}</dd></div><div><dt>{t("account.collaborators")}</dt><dd>{members.map((item) => getActorName(state, item.actorId, language)).join(" · ") || "—"}</dd></div><div><dt>{t("account.activeProjects")}</dt><dd>{businessData.projects.filter((item) => item.stage !== "暂停或流失").length}</dd></div><div><dt>{t("account.products")}</dt><dd>{businessData.linkedProducts.map((item) => item.product!.name[language]).join(" · ") || businessData.samples.map((item) => text(item.product)).join(" · ") || businessData.projects.map((item) => text(item.product)).join(" · ") || "—"}</dd></div><div><dt>{t("account.lastActivity")}</dt><dd>{latest ? `${latest.occurredAt.slice(0, 10)} · ${text(latest.title)}` : t("account.noActivity")}</dd></div></dl></button>;
    })}</div>{!filtered.length && <Card className="account-empty">{t("account.noResults")}</Card>}<p className="account-demo-note">{t("account.demo")}</p>
    {createOpen && <Modal title={t("account.create")} onClose={reset}><div className="account-dialog-body"><label>{t("account.currentActor")}<select value={actorId} onChange={(event) => setActorId(event.target.value)}>{state.actors.filter((item) => item.functionTags.includes("sales")).map((actor) => <option key={actor.id} value={actor.id}>{text(actor.displayName)}</option>)}</select></label>{!candidates && <form className="modal-form" onSubmit={(event) => { event.preventDefault(); const found = findDuplicateCandidates(state, { name: input.name, aliases: [], domains: input.domain ? [input.domain] : [], country: input.country, city: input.region }); if (found.length) setCandidates(found); else create(); }}><div className="form-row"><label>{t("account.name")}<input required value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} /></label><label>{t("account.kind")}<select value={input.kind} onChange={(event) => setInput({ ...input, kind: event.target.value as Account["kind"] })}><option value="brand">{t("account.brand")}</option><option value="company">{t("account.company")}</option></select></label></div><div className="form-row"><label>{t("account.country")}<input required value={input.country} onChange={(event) => setInput({ ...input, country: event.target.value })} /></label><label>{t("account.regionCity")}<input value={input.region} onChange={(event) => setInput({ ...input, region: event.target.value })} /></label></div><label>{t("account.domain")}<input value={input.domain} onChange={(event) => setInput({ ...input, domain: event.target.value })} placeholder="demo.example.com" /></label><div className="modal-actions"><Button type="button" variant="ghost" onClick={reset}>{t("common.cancel")}</Button><Button type="submit">{t("account.duplicateAction")}</Button></div></form>}
      {candidates && <DuplicateReview state={state} candidates={candidates} business={business} actorId={actorId} onUseExisting={(accountId, decision) => { onResolve([accountId], decision, "Demo user selected existing account", candidates.find((item) => item.accountId === accountId)?.signals, input.name, actorId); reset(); onOpen(accountId); }} onKeepSeparate={(reason) => create(reason)} onRequestCollaboration={request} onOpenAction={(id, tab) => { reset(); onOpen(id, tab); }} />}</div></Modal>}
  </div>;
}
