import type { ReactNode } from "react";
import { StatusBadge } from "../business/status-badge";
import { Badge, Card } from "../ui/primitives";
import {
  effectiveStatus,
  formatMoney,
  getCommercialLevers,
  getGapRows,
  getNextActions,
  getQuotationRisks,
  getReadiness,
  getStrategy,
  getVersionChanges,
  priceGap,
  type QuotationContext,
} from "./quotation-data";

export function CommercialSummary({ context }: { context: QuotationContext }) {
  const quote = context.quotation;
  const gap = priceGap(quote);
  const values = [
    ["Current Offer", "当前报价", formatMoney(quote.unitPrice, quote.currency)],
    ["Customer Target", "客户目标", quote.targetPrice ? formatMoney(quote.targetPrice, quote.currency) : "尚未确认"],
    ["Price Gap", "价格差距", gap === undefined ? "尚未确认" : `${gap > 0 ? "+" : ""}${gap.toFixed(1)}%`],
    ["MOQ", "起订量", quote.moq ? quote.moq.toLocaleString("en-US") : "待填写"],
    ["Lead Time", "交期", quote.leadTime ?? "待填写"],
    ["Payment", "付款", quote.paymentTerm ?? "待填写"],
    ["Incoterm", "贸易术语", quote.incoterm || "待填写"],
    ["Validity", "有效期", quote.validUntil || "待填写"],
  ];
  return <Card className="quote-commercial-summary"><div className="quote-section-head"><div><span>COMMERCIAL SNAPSHOT</span><h2>商务摘要 / Commercial Summary</h2></div><StatusBadge status={effectiveStatus(quote)} /></div><div className="quote-summary-grid">{values.map(([en, zh, value]) => <div key={en}><small>{en}</small><strong>{value}</strong><span>{zh}</span></div>)}</div></Card>;
}

export function LineItems({ context }: { context: QuotationContext }) {
  const quote = context.quotation;
  const items = quote.lineItems ?? [];
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal + (quote.additionalFee ?? 0);
  return <QuoteSection index="01" title="报价明细 / Line Items" subtitle="Approved specifications carried into commercial scope">
    <div className="quote-inner-scroll"><table className="quote-detail-table"><thead><tr><th>产品 / Product</th><th>规格 / Specification</th><th>数量 / Quantity</th><th>单价 / Unit Price</th><th>金额 / Amount</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.product}</strong></td><td>{item.specification || "按确认样 / As approved sample"}</td><td>{item.quantity ? `${item.quantity.toLocaleString("en-US")} ${item.unit}` : "待确认"}</td><td>{formatMoney(item.unitPrice, item.currency)}</td><td>{formatMoney(item.amount, item.currency)}</td></tr>)}{items.length === 0 && <tr><td colSpan={5}>当前报价尚无产品明细。</td></tr>}</tbody></table></div>
    <dl className="quote-totals"><div><dt>Subtotal / 小计</dt><dd>{formatMoney(subtotal, quote.currency)}</dd></div><div><dt>Additional Fee / 其他费用</dt><dd>{quote.additionalFee ? formatMoney(quote.additionalFee, quote.currency) : "无 / None"}</dd></div><div><dt>Total / 合计</dt><dd>{formatMoney(total, quote.currency)}</dd></div></dl>
  </QuoteSection>;
}

export function PriceTiers({ context }: { context: QuotationContext }) {
  return <QuoteSection index="02" title="价格阶梯 / Price Tiers" subtitle="Use documented volume conditions; no inferred floor price">
    <div className="price-tier-list">{context.tiers.map((tier) => <article className={tier.recommended ? "recommended" : ""} key={tier.id}><div><span>{tier.commercialPosition ?? "Balanced"}</span>{tier.recommended && <Badge tone="blue">推荐 / Recommended</Badge>}</div><strong>{formatMoney(tier.unitPrice, tier.currency)}</strong><p>{tier.minimumQuantity.toLocaleString("en-US")}{tier.maximumQuantity ? `–${tier.maximumQuantity.toLocaleString("en-US")}` : "+"} {context.quotation.unit}</p><dl><div><dt>Lead Time</dt><dd>{tier.leadTime ?? context.quotation.leadTime ?? "待确认"}</dd></div><div><dt>MOQ</dt><dd>{(tier.moq ?? context.quotation.moq).toLocaleString("en-US")}</dd></div></dl><small>{tier.note ?? "按当前项目材料"}</small></article>)}{context.tiers.length === 0 && <p className="quote-empty-copy">当前项目材料中尚未确认价格阶梯。</p>}</div>
  </QuoteSection>;
}

export function GapMatrix({ context }: { context: QuotationContext }) {
  return <QuoteSection index="03" title="商务差距矩阵 / Negotiation Gap" subtitle="Fact-based comparison of recorded positions">
    <div className="negotiation-gap-grid">{getGapRows(context.quotation).map((row) => <article key={row.label}><div><strong>{row.label}</strong><Badge tone={row.status === "Aligned" || row.status === "Close" ? "green" : row.status === "Gap" ? "amber" : "neutral"}>{row.status}</Badge></div><dl><div><dt>Our Position</dt><dd>{row.ours}</dd></div><div><dt>Customer Position</dt><dd>{row.customer}</dd></div></dl><small>{row.note}</small></article>)}</div>
  </QuoteSection>;
}

export function NegotiationTimeline({ context }: { context: QuotationContext }) {
  return <QuoteSection index="04" title="谈判时间线 / Negotiation Timeline" subtitle="Trace every commercial signal and next move">
    <div className="negotiation-timeline">{context.records.map((record) => <article className="negotiation-node" key={record.id}><time>{record.recordedAt}</time><span className="negotiation-dot" /><div><div><Badge>{record.type ?? record.direction}</Badge><small>{record.actor ?? record.direction}</small></div><h3>{record.summary}</h3><dl><div><dt>Our Position</dt><dd>{record.ourPosition ?? "当前项目材料中尚未确认"}</dd></div><div><dt>Customer Position</dt><dd>{record.customerPosition ?? "当前项目材料中尚未确认"}</dd></div></dl><p>{record.note}</p><strong>Next Move → {record.nextMove ?? record.nextAction}</strong></div></article>)}{context.records.length === 0 && <p className="quote-empty-copy">当前项目尚无谈判记录。</p>}</div>
  </QuoteSection>;
}

export function VersionHistory({ context }: { context: QuotationContext }) {
  const previous = context.versions[context.versions.findIndex((item) => item.id === context.quotation.id) - 1];
  const changes = getVersionChanges(context.quotation, previous);
  return <QuoteSection index="05" title="版本历史 / Version History" subtitle="Only material changes are highlighted">
    <div className="quote-version-history">{context.versions.map((quote) => <article className={quote.id === context.quotation.id ? "active" : ""} key={quote.id}><span>{quote.version}</span><strong>{formatMoney(quote.unitPrice, quote.currency)}</strong><small>{quote.createdAt ?? quote.issuedAt}</small><StatusBadge status={effectiveStatus(quote)} /></article>)}</div>
    {previous && <div className="quote-comparison"><h3>{previous.version} → {context.quotation.version} 变更 / Changed Fields</h3>{changes.length ? <div className="quote-inner-scroll"><table className="quote-comparison-table"><thead><tr><th>字段 / Field</th><th>{previous.version}</th><th>{context.quotation.version}</th></tr></thead><tbody>{changes.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.before}</td><td><strong>{row.after}</strong></td></tr>)}</tbody></table></div> : <p>与上一版本相比，没有已记录字段变化。</p>}<p className="quote-revision-reason"><strong>Revision Reason / 修改原因</strong>{context.quotation.reasonForRevision ?? "当前项目材料中尚未确认"}</p></div>}
  </QuoteSection>;
}

export function CommercialLevers({ context }: { context: QuotationContext }) {
  return <QuoteSection index="06" title="商务杠杆 / Commercial Levers" subtitle="Trade conditions deliberately; do not expose cost or margin">
    <div className="commercial-lever-list">{getCommercialLevers(context.quotation).map((item) => <article key={item.lever}><strong>{item.lever}</strong><p><span>Current</span>{item.current}</p><p><span>Possible</span>{item.possible}</p><small>{item.impact}</small></article>)}</div>
  </QuoteSection>;
}

export function Strategy({ context }: { context: QuotationContext }) {
  const strategy = getStrategy(context.quotation, context.tiers);
  return <section className="quote-strategy"><div className="quote-section-head"><div><span>PROTOTYPE SALES STRATEGY</span><h2>谈判策略 / Negotiation Strategy</h2></div><Badge>Mock AI</Badge></div><h3>{strategy.objective}</h3><div className="strategy-columns"><div><strong>Protect / 守住</strong>{strategy.protect.map((item) => <p key={item}>— {item}</p>)}</div><div><strong>Trade / 可交换</strong>{strategy.trade.map((item) => <p key={item}>— {item}</p>)}</div><div><strong>Ask / 要确认</strong>{strategy.ask.map((item) => <p key={item}>— {item}</p>)}</div></div><div className="strategy-package"><span>Recommended Package / 推荐组合</span><strong>{strategy.package}</strong></div><p className="quote-ai-notice">当前为原型模拟结果，尚未接入真实业务AI模型。</p></section>;
}

export function QuoteSidebar({ context, onCreatePO }: { context: QuotationContext; onCreatePO: () => void }) {
  const readiness = getReadiness(context.quotation);
  const risks = getQuotationRisks(context);
  const actions = getNextActions(context);
  return <>
    <Card className="quote-readiness"><div className="quote-section-head"><div><span>READINESS</span><h2>发送准备度</h2></div><Badge tone={readiness.status === "Ready to Send" ? "green" : readiness.status === "Blocked" ? "red" : "amber"}>{readiness.status}</Badge></div>{readiness.criteria.map((item) => <p key={item.label}><span>{item.ready ? "✓" : "○"}</span>{item.label}</p>)}</Card>
    <Card className="quote-risks"><div className="quote-section-head"><div><span>WATCHLIST</span><h2>当前风险 / Risks</h2></div><small>{risks.length}</small></div>{risks.map((risk) => <article key={risk.title}><Badge tone={risk.level === "High" ? "red" : risk.level === "Medium" ? "amber" : "neutral"}>{risk.level}</Badge><strong>{risk.title}</strong><p>{risk.detail}</p></article>)}{risks.length === 0 && <p className="quote-empty-copy">没有需要升级的报价风险。</p>}</Card>
    <Card className="quote-next"><div className="quote-section-head"><div><span>NEXT BEST ACTION</span><h2>下一步行动</h2></div></div>{actions.map((item, index) => <article key={item.action}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.action}</strong><p>{item.owner} · {item.timing}</p></div></article>)}{effectiveStatus(context.quotation) === "Accepted" && !context.purchaseOrder && <button className="btn btn-primary quote-po-button" onClick={onCreatePO}>创建 PO / Create Purchase Order</button>}</Card>
  </>;
}

function QuoteSection({ index, title, subtitle, children }: { index: string; title: string; subtitle: string; children: ReactNode }) {
  return <Card className="quote-section"><div className="quote-section-head"><div><span>{index} · {subtitle}</span><h2>{title}</h2></div></div>{children}</Card>;
}
