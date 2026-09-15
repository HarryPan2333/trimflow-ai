import type { ReactNode } from "react";
import { StatusBadge } from "../business/status-badge";
import { Badge, Card } from "../ui/primitives";
import { useI18n } from "../providers/language-provider";
import {
  effectiveStatus, formatMoney, getCommercialLevers, getGapRows, getNextActions,
  getQuotationRisks, getReadiness, getStrategy, getVersionChanges, priceGap,
  type QuotationContext,
} from "./quotation-data";

export function CommercialSummary({ context }: { context: QuotationContext }) {
  const { language, t, text, formatDate } = useI18n();
  const quote = context.quotation;
  const gap = priceGap(quote);
  const values = [
    [t("quotation.currentOffer"), formatMoney(quote.unitPrice, quote.currency, 2, language)],
    [t("quotation.customerTarget"), quote.targetPrice ? formatMoney(quote.targetPrice, quote.currency, 2, language) : t("common.notConfirmed")],
    [t("quotation.gap"), gap === undefined ? t("common.notConfirmed") : `${gap > 0 ? "+" : ""}${gap.toFixed(1)}%`],
    ["MOQ", quote.moq ? quote.moq.toLocaleString("en-US") : t("common.notProvided")],
    [t("common.leadTime"), text(quote.leadTime ?? t("common.notProvided"))],
    [t("quotation.paymentTerm"), text(quote.paymentTerm ?? t("common.notProvided"))],
    [t("quotation.incoterm"), text(quote.incoterm || t("common.notProvided"))],
    [t("common.validUntil"), quote.validUntil ? formatDate(quote.validUntil) : t("common.notProvided")],
  ];
  return <Card className="quote-commercial-summary"><div className="quote-section-head"><div><span>{t("quotation.snapshot")}</span><h2>{t("quotation.commercialSummary")}</h2></div><StatusBadge status={effectiveStatus(quote)} /></div><div className="quote-summary-grid">{values.map(([field, value]) => <div key={field}><small>{field}</small><strong>{value}</strong></div>)}</div></Card>;
}

export function LineItems({ context }: { context: QuotationContext }) {
  const { language, t, label, text } = useI18n();
  const quote = context.quotation;
  const items = quote.lineItems ?? [];
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal + (quote.additionalFee ?? 0);
  return <QuoteSection index="01" title={t("quotation.lineItems")} subtitle={t("quotation.lineItemsHelp")}>
    <div className="quote-inner-scroll"><table className="quote-detail-table"><thead><tr><th>{t("common.product")}</th><th>{t("common.specification")}</th><th>{t("common.quantity")}</th><th>{t("common.unitPrice")}</th><th>{t("common.amount")}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{text(item.product)}</strong></td><td>{text(item.specification || "按确认样 / As approved sample")}</td><td>{item.quantity ? `${item.quantity.toLocaleString("en-US")} ${label(item.unit)}` : t("common.notConfirmed")}</td><td>{formatMoney(item.unitPrice, item.currency, 2, language)}</td><td>{formatMoney(item.amount, item.currency, 2, language)}</td></tr>)}{items.length === 0 && <tr><td colSpan={5}>{t("quotation.noLineItems")}</td></tr>}</tbody></table></div>
    <dl className="quote-totals"><div><dt>{t("quotation.subtotal")}</dt><dd>{formatMoney(subtotal, quote.currency, 2, language)}</dd></div><div><dt>{t("quotation.additionalFee")}</dt><dd>{quote.additionalFee ? formatMoney(quote.additionalFee, quote.currency, 2, language) : t("quotation.none")}</dd></div><div><dt>{t("common.total")}</dt><dd>{formatMoney(total, quote.currency, 2, language)}</dd></div></dl>
  </QuoteSection>;
}

export function PriceTiers({ context }: { context: QuotationContext }) {
  const { language, t, label, text } = useI18n();
  return <QuoteSection index="02" title={t("quotation.priceTiers")} subtitle={t("quotation.tiersHelp")}>
    <div className="price-tier-list">{context.tiers.map((tier) => <article className={tier.recommended ? "recommended" : ""} key={tier.id}><div><span>{label(tier.commercialPosition ?? "Balanced")}</span>{tier.recommended && <Badge tone="blue">{t("quotation.recommended")}</Badge>}</div><strong>{formatMoney(tier.unitPrice, tier.currency, 2, language)}</strong><p>{tier.minimumQuantity.toLocaleString("en-US")}{tier.maximumQuantity ? `–${tier.maximumQuantity.toLocaleString("en-US")}` : "+"} {label(context.quotation.unit)}</p><dl><div><dt>{t("common.leadTime")}</dt><dd>{text(tier.leadTime ?? context.quotation.leadTime ?? t("common.notConfirmed"))}</dd></div><div><dt>MOQ</dt><dd>{(tier.moq ?? context.quotation.moq).toLocaleString("en-US")}</dd></div></dl><small>{text(tier.note ?? t("quotation.projectMaterial"))}</small></article>)}{context.tiers.length === 0 && <p className="quote-empty-copy">{t("quotation.noTiers")}</p>}</div>
  </QuoteSection>;
}

export function GapMatrix({ context }: { context: QuotationContext }) {
  const { language, t, label, text } = useI18n();
  return <QuoteSection index="03" title={t("quotation.gapMatrix")} subtitle={t("quotation.gapHelp")}>
    <div className="negotiation-gap-grid">{getGapRows(context.quotation, language).map((row) => <article key={row.label}><div><strong>{row.label}</strong><Badge tone={row.status === "Aligned" || row.status === "Close" ? "green" : row.status === "Gap" ? "amber" : "neutral"}>{label(row.status)}</Badge></div><dl><div><dt>{t("quotation.ourPosition")}</dt><dd>{text(row.ours)}</dd></div><div><dt>{t("quotation.customerPosition")}</dt><dd>{text(row.customer)}</dd></div></dl><small>{row.note}</small></article>)}</div>
  </QuoteSection>;
}

export function NegotiationTimeline({ context }: { context: QuotationContext }) {
  const { t, label, text, formatDate } = useI18n();
  return <QuoteSection index="04" title={t("quotation.timeline")} subtitle={t("quotation.timelineHelp")}>
    <div className="negotiation-timeline">{context.records.map((record) => <article className="negotiation-node" key={record.id}><time>{formatDate(record.recordedAt)}</time><span className="negotiation-dot" /><div><div><Badge>{label(record.type ?? record.direction)}</Badge><small>{text(record.actor ?? record.direction)}</small></div><h3>{text(record.summary)}</h3><dl><div><dt>{t("quotation.ourPosition")}</dt><dd>{text(record.ourPosition ?? t("common.notConfirmed"))}</dd></div><div><dt>{t("quotation.customerPosition")}</dt><dd>{text(record.customerPosition ?? t("common.notConfirmed"))}</dd></div></dl><p>{text(record.note ?? "")}</p><strong>{t("quotation.nextMove")} → {text(record.nextMove ?? record.nextAction)}</strong></div></article>)}{context.records.length === 0 && <p className="quote-empty-copy">{t("quotation.noNegotiation")}</p>}</div>
  </QuoteSection>;
}

export function VersionHistory({ context }: { context: QuotationContext }) {
  const { language, t, text, formatDate } = useI18n();
  const previous = context.versions[context.versions.findIndex((item) => item.id === context.quotation.id) - 1];
  const changes = getVersionChanges(context.quotation, previous);
  return <QuoteSection index="05" title={t("quotation.versionHistory")} subtitle={t("quotation.historyHelp")}>
    <div className="quote-version-history">{context.versions.map((quote) => <article className={quote.id === context.quotation.id ? "active" : ""} key={quote.id}><span>{quote.version}</span><strong>{formatMoney(quote.unitPrice, quote.currency, 2, language)}</strong><small>{formatDate(quote.createdAt ?? quote.issuedAt)}</small><StatusBadge status={effectiveStatus(quote)} /></article>)}</div>
    {previous && <div className="quote-comparison"><h3>{previous.version} → {context.quotation.version} · {t("quotation.changedFields")}</h3>{changes.length ? <div className="quote-inner-scroll"><table className="quote-comparison-table"><thead><tr><th>{t("common.field")}</th><th>{previous.version}</th><th>{context.quotation.version}</th></tr></thead><tbody>{changes.map((row) => <tr key={row.label}><td>{text(row.label)}</td><td>{text(row.before)}</td><td><strong>{text(row.after)}</strong></td></tr>)}</tbody></table></div> : <p>{t("quotation.noVersionChanges")}</p>}<p className="quote-revision-reason"><strong>{t("quotation.revisionReason")}</strong>{text(context.quotation.reasonForRevision ?? t("common.notConfirmed"))}</p></div>}
  </QuoteSection>;
}

export function CommercialLevers({ context }: { context: QuotationContext }) {
  const { language, t } = useI18n();
  return <QuoteSection index="06" title={t("quotation.levers")} subtitle={t("quotation.leversHelp")}>
    <div className="commercial-lever-list">{getCommercialLevers(context.quotation, language).map((item) => <article key={item.lever}><strong>{item.lever}</strong><p><span>{t("quotation.currentValue")}</span>{item.current}</p><p><span>{t("quotation.possible")}</span>{item.possible}</p><small>{item.impact}</small></article>)}</div>
  </QuoteSection>;
}

export function Strategy({ context }: { context: QuotationContext }) {
  const { language, t } = useI18n();
  const strategy = getStrategy(context.quotation, context.tiers, language);
  return <section className="quote-strategy"><div className="quote-section-head"><div><span>{t("quotation.salesStrategy")}</span><h2>{t("quotation.strategy")}</h2></div><Badge>{t("quotation.mockSuggestion")}</Badge></div><h3>{strategy.objective}</h3><div className="strategy-columns"><div><strong>{t("quotation.protect")}</strong>{strategy.protect.map((item) => <p key={item}>— {item}</p>)}</div><div><strong>{t("quotation.trade")}</strong>{strategy.trade.map((item) => <p key={item}>— {item}</p>)}</div><div><strong>{t("quotation.ask")}</strong>{strategy.ask.map((item) => <p key={item}>— {item}</p>)}</div></div><div className="strategy-package"><span>{t("quotation.recommendedPackage")}</span><strong>{strategy.package}</strong></div><p className="quote-ai-notice">{t("quotation.prototypeNotice")}</p></section>;
}

export function QuoteSidebar({ context, onCreatePO }: { context: QuotationContext; onCreatePO: () => void }) {
  const { language, t, label, text } = useI18n();
  const readiness = getReadiness(context.quotation, language);
  const risks = getQuotationRisks(context, language);
  const actions = getNextActions(context, language);
  return <>
    <Card className="quote-readiness"><div className="quote-section-head"><div><span>{t("quotation.readiness")}</span><h2>{t("quotation.readyToSend")}</h2></div><Badge tone={readiness.status === "Ready to Send" ? "green" : readiness.status === "Blocked" ? "red" : "amber"}>{label(readiness.status)}</Badge></div>{readiness.criteria.map((item) => <p key={item.label}><span>{item.ready ? "✓" : "○"}</span>{item.label}</p>)}</Card>
    <Card className="quote-risks"><div className="quote-section-head"><div><span>{t("quotation.watchlist")}</span><h2>{t("project.risks.title")}</h2></div><small>{risks.length}</small></div>{risks.map((risk) => <article key={risk.title}><Badge tone={risk.level === "High" ? "red" : risk.level === "Medium" ? "amber" : "neutral"}>{label(risk.level)}</Badge><strong>{risk.title}</strong><p>{risk.detail}</p></article>)}{risks.length === 0 && <p className="quote-empty-copy">{t("quotation.noRisks")}</p>}</Card>
    <Card className="quote-next"><div className="quote-section-head"><div><span>{t("order.nextBestAction")}</span><h2>{t("common.nextAction")}</h2></div></div>{actions.map((item, index) => <article key={item.action}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{text(item.action)}</strong><p>{text(item.owner)} · {text(item.timing)}</p></div></article>)}{effectiveStatus(context.quotation) === "Accepted" && !context.purchaseOrder && <button className="btn btn-primary quote-po-button" onClick={onCreatePO}>{t("quotation.createPO")}</button>}</Card>
  </>;
}

function QuoteSection({ index, title, subtitle, children }: { index: string; title: string; subtitle: string; children: ReactNode }) {
  return <Card className="quote-section"><div className="quote-section-head"><div><span>{index} · {subtitle}</span><h2>{title}</h2></div></div>{children}</Card>;
}
