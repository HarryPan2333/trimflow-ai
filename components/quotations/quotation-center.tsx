"use client";

import { useMemo, useState } from "react";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import { PageHeader } from "../layout/page-header";
import { StatusBadge } from "../business/status-badge";
import { Badge, Button, Card } from "../ui/primitives";
import type { Project } from "../../lib/mock-data";
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

const filters: Array<{ id: QuotationFilter; label: string }> = [
  { id: "All", label: "全部 / All" },
  { id: "Draft", label: "草稿 / Draft" },
  { id: "Sent", label: "已发送 / Sent" },
  { id: "Negotiating", label: "谈判中 / Negotiating" },
  { id: "Accepted", label: "已接受 / Accepted" },
  { id: "Expired", label: "已过期 / Expired" },
];

export function QuotationCenter({ workspace, projects, language, onOpenQuotation, onCreate }: {
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
  const isEn = language === "English";

  return <div className="quotation-workspace">
    <PageHeader
      title="报价与谈判中心 / Quotation & Negotiation"
      subtitle="Turn approved product facts into controlled commercial decisions."
      actions={<Button onClick={onCreate}>＋ 新建报价 / New Quote</Button>}
    />

    <div className="quote-metrics" aria-label="报价指标">
      {[
        ["Active Quotes", "活跃报价", metrics.active],
        ["Negotiating", "谈判中", metrics.negotiating],
        ["Expiring Soon", "即将到期", metrics.expiring],
        ["Accepted", "已接受", metrics.accepted],
      ].map(([label, zh, value], index) => <Card className="quote-metric" key={String(label)}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{label}</small><strong>{value}</strong><p>{zh}</p></div></Card>)}
    </div>

    <Card className="quote-list-panel">
      <div className="quote-list-toolbar">
        <div><span className="eyebrow">COMMERCIAL PIPELINE</span><h2>{isEn ? "Quotation Portfolio" : "报价组合"}</h2><p>{rows.length} records · Demo Workspace</p></div>
        <label className="quote-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索报价、客户、项目或产品..." /></label>
      </div>
      <div className="quote-filter-row" role="tablist" aria-label="报价状态筛选">
        {filters.map((item) => <button key={item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}
      </div>
      <div className="quote-table-scroll">
        <table className="quote-table">
          <thead><tr><th>报价 / Quotation</th><th>客户与项目 / Client & Project</th><th>产品 / Product</th><th>版本 / Version</th><th>数量 / Quantity</th><th>单价 / Unit Price</th><th>MOQ</th><th>状态 / Status</th><th>有效期 / Valid Until</th><th>价差 / Price Gap</th><th>负责人 / Owner</th><th>下一步 / Next Action</th></tr></thead>
          <tbody>{rows.map((context) => {
            const quote = context.quotation;
            const gap = priceGap(quote);
            const health = getNegotiationHealth(quote);
            return <tr key={quote.id}>
              <td><button className="quote-id-link" onClick={() => onOpenQuotation(quote.id)}>{quote.id}<small>Open record →</small></button></td>
              <td><strong>{context.client?.name ?? "匿名客户"}</strong><small>{context.project?.code} · {context.project?.name}</small></td>
              <td>{quote.product}</td><td>{quote.version}</td><td>{quote.quantity ? `${quote.quantity.toLocaleString("en-US")} ${quote.unit}` : "待确认"}</td>
              <td><strong>{formatMoney(quote.unitPrice, quote.currency)}</strong></td><td>{quote.moq ? quote.moq.toLocaleString("en-US") : "待确认"}</td>
              <td><StatusBadge status={effectiveStatus(quote)} /></td><td>{quote.validUntil || "待确认"}<small className={`quote-health quote-health-${health.level}`}>{health.label}</small></td>
              <td>{gap === undefined ? <Badge>待确认</Badge> : <Badge tone={Math.abs(gap) <= 5 ? "green" : "amber"}>{gap > 0 ? "+" : ""}{gap.toFixed(1)}%</Badge>}</td>
              <td>{quote.owner ?? context.project?.owner ?? "待分配"}</td><td><span className="quote-next-cell">{quote.nextAction ?? "跟进客户商务反馈"}</span></td>
            </tr>;
          })}{rows.length === 0 && <tr><td colSpan={12} className="quote-empty-row">没有匹配的报价记录。</td></tr>}</tbody>
        </table>
      </div>
      <p className="quote-prototype-note">当前为原型模拟结果，尚未接入真实业务AI模型。会话内操作刷新后恢复。</p>
    </Card>
  </div>;
}
