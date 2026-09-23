"use client";

import { useState } from "react";
import { useI18n } from "../providers/language-provider";
import { Badge, Button, Card } from "../ui/primitives";
import type { AccountState, DuplicateCandidate, DuplicateResolution } from "../../lib/accounts/types";
import { getAccountBusiness } from "../../lib/accounts/aggregation";
import { getAccountTeam, getActorName, getFirstDiscovery } from "../../lib/accounts/selectors";
import { getAccountTimeline } from "../../lib/accounts/timeline";
import type { Project } from "../../lib/mock-data";
import type { ProductLibraryData } from "../../lib/product-library/types";
import type { SampleWorkspace } from "../samples/sample-data";
import type { QuotationWorkspace } from "../quotations/quotation-data";
import type { OrderWorkspace } from "../orders/order-data";

export type AccountBusinessContext = { projects: Project[]; products: ProductLibraryData; samples: SampleWorkspace; quotations: QuotationWorkspace; orders: OrderWorkspace };

export function DuplicateReview({ state, candidates, business, actorId, onUseExisting, onKeepSeparate, onRequestCollaboration, onOpenAction }: {
  state: AccountState; candidates: DuplicateCandidate[]; business: AccountBusinessContext; actorId: string;
  onUseExisting: (accountId: string, decision: DuplicateResolution["decision"]) => void;
  onKeepSeparate: (reason: string) => void;
  onRequestCollaboration: (accountId: string) => void;
  onOpenAction: (accountId: string, tab: "overview" | "contacts" | "ownership") => void;
}) {
  const { language, t, text } = useI18n();
  const [reason, setReason] = useState("");
  return <div className="account-duplicate-review" role="region" aria-label={t("account.existingFound")}>
    <h3>{t("account.existingFound")}</h3><p>{t("account.duplicateHelp")}</p>
    {candidates.map((candidate) => {
      const account = state.accounts.find((item) => item.id === candidate.accountId)!;
      const discovery = getFirstDiscovery(state, account.id);
      const team = getAccountTeam(state, account.id);
      const recentShared = state.activities.filter((item) => item.accountId === account.id).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
      const recent = recentShared ?? getAccountTimeline(state, account.id)[0];
      const businessData = getAccountBusiness(state, account.id, business.projects, business.products, business.samples, business.quotations, business.orders);
      return <Card className="account-duplicate-candidate" key={candidate.accountId}>
        <div className="account-candidate-head"><strong>{account.name}</strong><Badge tone={candidate.confidence === "high" ? "amber" : "neutral"}>{t(candidate.confidence === "high" ? "account.matchHigh" : candidate.confidence === "review" ? "account.matchReview" : "account.matchWeak")}</Badge></div>
        <div className="account-reasons">{candidate.reasons.map((item) => <Badge key={item.en}>{text(item)}</Badge>)}</div>
        <dl className="account-candidate-facts"><div><dt>{t("account.firstDiscovery")}</dt><dd>{discovery ? `${discovery.discoveredAt} · ${getActorName(state, discovery.discoveredByActorId, language)}` : "—"}</dd></div><div><dt>{t("account.owner")}</dt><dd>{getActorName(state, team.owner?.ownerActorId, language)}</dd></div><div><dt>{t("account.collaborators")}</dt><dd>{team.members.map((item) => getActorName(state, item.actorId, language)).join("、") || "—"}</dd></div><div><dt>{t("account.activeProjects")}</dt><dd>{businessData.projects.filter((item) => item.stage !== "暂停或流失").length}</dd></div><div><dt>{t("account.lastActivity")}</dt><dd>{recent ? `${recent.occurredAt.slice(0, 10)} · ${text(recent.title)}` : t("account.noActivity")}</dd></div></dl>
        <div className="account-actions"><Button variant="secondary" onClick={() => onOpenAction(account.id, "overview")}>{t("account.viewExisting")}</Button><Button variant="secondary" onClick={() => onRequestCollaboration(account.id)} disabled={team.owner?.ownerActorId === actorId || team.members.some((item) => item.actorId === actorId)}>{t("account.requestCollab")}</Button><Button variant="secondary" onClick={() => onOpenAction(account.id, "contacts")}>{t("account.addContact")}</Button><Button variant="secondary" onClick={() => onOpenAction(account.id, "ownership")}>{t("account.addOffice")}</Button><Button onClick={() => onUseExisting(account.id, "use_existing")}>{t("account.mergeUseExisting")}</Button></div>
      </Card>;
    })}
    <label className="account-keep-reason">{t("account.keepReason")}<textarea rows={2} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
    <Button variant="secondary" disabled={!reason.trim()} onClick={() => onKeepSeparate(reason.trim())}>{t("account.keepSeparate")}</Button>
  </div>;
}
