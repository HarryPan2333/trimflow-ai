"use client";

import { useMemo, useState } from "react";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import { PageHeader } from "../layout/page-header";
import { StatusBadge } from "../business/status-badge";
import { Badge, Button, Card } from "../ui/primitives";
import type { Project } from "../../lib/mock-data";
import { useI18n } from "../providers/language-provider";
import {
  effectiveStatus,
  formatMoney,
  getNegotiationHealth,
  getQuotationContext,
  getQuotationMetrics,
  priceGap,
  statusMatches,
  type QuotationFilter,
  type QuotationWorkspace,
} from "./quotation-data";

const filters: QuotationFilter[] = ["All", "Draft", "Sent", "Negotiating", "Accepted", "Expired"];

export function QuotationCenter({ workspace, projects, onOpenQuotation, onCreate }: {
  workspace: QuotationWorkspace;
  projects: Project[];
  language: InterfaceLanguage;
  onOpenQuotation: (id: string) => void;
  onCreate: () => void;
}) {
  const [filter, setFilter] = useState<QuotationFilter>("All");
  const [search, setSearch] = useState("");
  const metrics = getQuotationMetrics(workspace);
  const rows = useMemo(() => workspace.quotations
    .map((quotation) => getQuotationContext(quotation, workspace, projects))
    .filter((context) => {
      const haystack = `${context.quotation.id} ${context.client?.name} ${context.project?.code} ${context.project?.name} ${context.quotation.product}`.toLowerCase();
      return statusMatches(context.quotation, filter) && haystack.includes(search.trim().toLowerCase());
    })
    .sort((a, b) => (b.quotation.lastActivityAt ?? b.quotation.issuedAt).localeCompare(a.quotation.lastActivityAt ?? a.quotation.issuedAt)), [filter, projects, search, workspace]);
  const { language: interfaceLanguage, t, label, text, formatDate } = useI18n();

  return <div className="quotation-workspace">
    <PageHeader
      title={t("quotation.centerTitle")}
      subtitle={t("quotation.subtitle")}
      actions={<Button onClick={onCreate}>＋ {t("quotation.new")}</Button>}
    />

    <div className="quote-metrics" aria-label={t("quotation.portfolio")}>
      {[
        [t("quotation.stats.active"), t("quotation.stats.active"), metrics.active],
        [label("Negotiating"), label("Negotiating"), metrics.negotiating],
        [t("quotation.stats.expiring"), t("quotation.stats.expiring"), metrics.expiring],
        [label("Accepted"), label("Accepted"), metrics.accepted],
      ].map(([metricLabel, supportingLabel, value], index) => <Card className="quote-metric" key={String(metricLabel)}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{metricLabel}</small><strong>{value}</strong><p>{supportingLabel}</p></div></Card>)}
    </div>

    <Card className="quote-list-panel">
      <div className="quote-list-toolbar">
        <div><span className="eyebrow">{t("quotation.pipeline")}</span><h2>{t("quotation.portfolio")}</h2><p>{t("quotation.recordsDemo", { count: rows.length })}</p></div>
        <label className="quote-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("quotation.search")} /></label>
      </div>
      <div className="quote-filter-row" role="tablist" aria-label={t("quotation.filterLabel")}>
        {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "All" ? t("common.all") : label(item)}</button>)}
      </div>
      <div className="quote-table-scroll">
        <table className="quote-table">
          <thead><tr><th>{t("quotation.table.id")}</th><th>{t("common.projectAndClient")}</th><th>{t("common.product")}</th><th>{t("common.version")}</th><th>{t("common.quantity")}</th><th>{t("common.unitPrice")}</th><th>MOQ</th><th>{t("common.status")}</th><th>{t("common.validUntil")}</th><th>{t("quotation.gap")}</th><th>{t("common.owner")}</th><th>{t("common.nextAction")}</th></tr></thead>
          <tbody>{rows.map((context) => {
            const quote = context.quotation;
            const gap = priceGap(quote);
            const health = getNegotiationHealth(quote, interfaceLanguage);
            return <tr key={quote.id}>
              <td><button className="quote-id-link" onClick={() => onOpenQuotation(quote.id)}>{quote.id}<small>{t("common.openRecord")} →</small></button></td>
              <td><strong>{text(context.client?.name ?? t("order.anonymousClient"))}</strong><small>{context.project?.code} · {text(context.project?.name ?? "")}</small></td>
              <td>{text(quote.product)}</td><td>{quote.version}</td><td>{quote.quantity ? `${quote.quantity.toLocaleString("en-US")} ${label(quote.unit)}` : t("common.notConfirmed")}</td>
              <td><strong>{formatMoney(quote.unitPrice, quote.currency, 2, interfaceLanguage)}</strong></td><td>{quote.moq ? quote.moq.toLocaleString("en-US") : t("common.notConfirmed")}</td>
              <td><StatusBadge status={effectiveStatus(quote)} /></td><td>{quote.validUntil ? formatDate(quote.validUntil) : t("common.notConfirmed")}<small className={`quote-health quote-health-${health.level}`}>{health.label}</small></td>
              <td>{gap === undefined ? <Badge>{t("common.notConfirmed")}</Badge> : <Badge tone={Math.abs(gap) <= 5 ? "green" : "amber"}>{gap > 0 ? "+" : ""}{gap.toFixed(1)}%</Badge>}</td>
              <td>{text(quote.owner ?? context.project?.owner ?? t("common.notAssigned"))}</td><td><span className="quote-next-cell">{text(quote.nextAction ?? t("quotation.clientFeedback"))}</span></td>
            </tr>;
          })}{rows.length === 0 && <tr><td colSpan={12} className="quote-empty-row">{t("quotation.empty")}</td></tr>}</tbody>
        </table>
      </div>
      <p className="quote-prototype-note">{t("quotation.prototypeNotice")}</p>
    </Card>
  </div>;
}
