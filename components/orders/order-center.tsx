"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "../layout/page-header";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import { Badge, Card } from "../ui/primitives";
import type { Project } from "../../lib/mock-data";
import type { QuotationWorkspace } from "../quotations/quotation-data";
import { formatOrderValue, getOrderContext, getOrderHealth, getOrderMetrics, matchesOrderFilter, type OrderFilter, type OrderWorkspace } from "./order-data";

const filters: Array<{ id: OrderFilter; label: string }> = [
  { id: "All", label: "全部 / All" }, { id: "Active", label: "执行中 / Active" }, { id: "At Risk", label: "风险 / At Risk" }, { id: "Shipping Soon", label: "即将出货 / Shipping Soon" }, { id: "Completed", label: "已完成 / Completed" },
];

export function OrderCenter({ workspace, quotationWorkspace, projects, language, onOpenOrder }: { workspace: OrderWorkspace; quotationWorkspace: QuotationWorkspace; projects: Project[]; language: InterfaceLanguage; onOpenOrder: (id: string) => void }) {
  const [filter, setFilter] = useState<OrderFilter>("All");
  const [search, setSearch] = useState("");
  const metrics = getOrderMetrics(workspace, quotationWorkspace, projects);
  const rows = useMemo(() => workspace.orders.map((order) => getOrderContext(order, workspace, quotationWorkspace, projects)).filter((context) => {
    const text = `${context.order.poNumber} ${context.client?.name} ${context.project?.code} ${context.project?.name} ${context.lines.map((item) => item.product).join(" ")}`.toLowerCase();
    return matchesOrderFilter(context, filter) && text.includes(search.trim().toLowerCase());
  }).sort((a, b) => b.order.poDate.localeCompare(a.order.poDate)), [filter, projects, quotationWorkspace, search, workspace]);
  const isEn = language === "English";
  return <div className="order-workspace">
    <PageHeader title="订单执行中心 / Order Execution" subtitle="Track purchase orders from confirmation through production, delivery, shipment and payment." />
    <Card className="order-metrics"><div><span>Active Orders</span><strong>{metrics.active}</strong><small>执行中订单</small></div><div><span>At Risk</span><strong>{metrics.atRisk}</strong><small>存在风险</small></div><div><span>Shipping Soon</span><strong>{metrics.shippingSoon}</strong><small>即将出货</small></div><div><span>Completed</span><strong>{metrics.completed}</strong><small>已完成</small></div></Card>
    <Card className="order-list-panel">
      <div className="order-list-toolbar"><div><span className="eyebrow">EXECUTION PORTFOLIO</span><h2>{isEn ? "Purchase Orders" : "采购订单"}</h2><p>{rows.length} records · Synthetic Data</p></div><label className="order-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索 PO、客户、项目或产品..." /></label></div>
      <div className="order-filter-row">{filters.map((item) => <button className={filter === item.id ? "active" : ""} key={item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
      <div className="order-table-scroll"><table className="order-table"><thead><tr><th>采购订单 / PO</th><th>客户与项目 / Client & Project</th><th>产品 / Product</th><th>订单金额 / Order Value</th><th>PO Date</th><th>Required Delivery</th><th>Current Stage</th><th>Order Health</th><th>Owner</th><th>Next Milestone</th><th>Next Action</th></tr></thead><tbody>{rows.map((context) => {
        const health = getOrderHealth(context); const milestone = context.order.productionMilestones?.find((item) => item.status !== "Completed");
        return <tr key={context.order.id}><td><button className="order-id-link" onClick={() => onOpenOrder(context.order.id)}>{context.order.poNumber}<small>Open execution →</small></button></td><td><strong>{context.client?.name ?? "匿名客户"}</strong><small>{context.project?.code} · {context.project?.name}</small></td><td>{context.lines.map((item) => item.product).join(" · ") || context.quotation?.product || "待确认"}</td><td><strong>{formatOrderValue(context.order.amount, context.order.currency)}</strong></td><td>{context.order.poDate}</td><td>{context.order.deliveryDate || "待确认"}</td><td><Badge>{context.order.currentStage}</Badge></td><td><span className={`order-health-label health-${health.status.toLowerCase().replaceAll(" ", "-")}`}>{health.status}</span><small>{health.reason}</small></td><td>{context.order.owner}</td><td>{milestone ? <><strong>{milestone.label}</strong><small>{milestone.targetDate}</small></> : "待确认"}</td><td><span className="order-next-cell">{context.project?.next ?? "推进当前执行节点"}</span></td></tr>;
      })}{rows.length === 0 && <tr><td colSpan={11} className="order-empty-row">当前筛选下没有订单。Case A 与 Case C 尚未形成正式 PO。</td></tr>}</tbody></table></div>
      <p className="order-demo-note">Demo Workspace · 所有订单、合同、物流和回款数据均为虚构或脱敏数据。</p>
    </Card>
  </div>;
}
