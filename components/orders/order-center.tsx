"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "../layout/page-header";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import { Badge, Card } from "../ui/primitives";
import type { Project } from "../../lib/mock-data";
import type { QuotationWorkspace } from "../quotations/quotation-data";
import { formatOrderValue, getOrderContext, getOrderHealth, getOrderMetrics, matchesOrderFilter, type OrderFilter, type OrderWorkspace } from "./order-data";
import { useI18n } from "../providers/language-provider";

const filters: Array<{ id: OrderFilter; key: "order.all" | "order.active" | "order.atRisk" | "order.shippingSoon" | "order.completed" }> = [
  { id: "All", key: "order.all" }, { id: "Active", key: "order.active" }, { id: "At Risk", key: "order.atRisk" }, { id: "Shipping Soon", key: "order.shippingSoon" }, { id: "Completed", key: "order.completed" },
];

export function OrderCenter({ workspace, quotationWorkspace, projects, onOpenOrder }: { workspace: OrderWorkspace; quotationWorkspace: QuotationWorkspace; projects: Project[]; language: InterfaceLanguage; onOpenOrder: (id: string) => void }) {
  const { language, t, label, text, formatDate } = useI18n();
  const [filter, setFilter] = useState<OrderFilter>("All");
  const [search, setSearch] = useState("");
  const metrics = getOrderMetrics(workspace, quotationWorkspace, projects);
  const rows = useMemo(() => workspace.orders.map((order) => getOrderContext(order, workspace, quotationWorkspace, projects)).filter((context) => {
    const text = `${context.order.poNumber} ${context.client?.name} ${context.project?.code} ${context.project?.name} ${context.lines.map((item) => item.product).join(" ")}`.toLowerCase();
    return matchesOrderFilter(context, filter) && text.includes(search.trim().toLowerCase());
  }).sort((a, b) => b.order.poDate.localeCompare(a.order.poDate)), [filter, projects, quotationWorkspace, search, workspace]);
  return <div className="order-workspace">
    <PageHeader title={t("order.centerTitle")} subtitle={t("order.centerSubtitle")} />
    <Card className="order-metrics"><div><span>{t("order.active")}</span><strong>{metrics.active}</strong></div><div><span>{t("order.atRisk")}</span><strong>{metrics.atRisk}</strong></div><div><span>{t("order.shippingSoon")}</span><strong>{metrics.shippingSoon}</strong></div><div><span>{t("order.completed")}</span><strong>{metrics.completed}</strong></div></Card>
    <Card className="order-list-panel">
      <div className="order-list-toolbar"><div><span className="eyebrow">{t("order.portfolioLabel")}</span><h2>{t("order.portfolio")}</h2><p>{t("common.records", { count: rows.length })} · {t("common.syntheticData")}</p></div><label className="order-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("order.search")} /></label></div>
      <div className="order-filter-row">{filters.map((item) => <button className={filter === item.id ? "active" : ""} key={item.id} onClick={() => setFilter(item.id)}>{t(item.key)}</button>)}</div>
      <div className="order-table-scroll"><table className="order-table"><thead><tr><th>PO</th><th>{t("common.client")} · {t("common.project")}</th><th>{t("common.product")}</th><th>{t("order.amount")}</th><th>{t("order.poDate")}</th><th>{t("order.requiredDelivery")}</th><th>{t("common.currentStage")}</th><th>{t("order.health")}</th><th>{t("common.owner")}</th><th>{t("order.nextMilestone")}</th><th>{t("common.nextAction")}</th></tr></thead><tbody>{rows.map((context) => {
        const health = getOrderHealth(context, language); const milestone = context.order.productionMilestones?.find((item) => item.status !== "Completed");
        return <tr key={context.order.id}><td><button className="order-id-link" onClick={() => onOpenOrder(context.order.id)}>{context.order.poNumber}<small>{t("order.openExecution")} →</small></button></td><td><strong>{text(context.client?.name ?? t("order.anonymousClient"))}</strong><small>{context.project?.code} · {text(context.project?.name ?? "")}</small></td><td>{text(context.lines.map((item) => item.product).join(" · ") || context.quotation?.product || t("common.notConfirmed"))}</td><td><strong>{formatOrderValue(context.order.amount, context.order.currency)}</strong></td><td>{formatDate(context.order.poDate)}</td><td>{context.order.deliveryDate ? formatDate(context.order.deliveryDate) : t("common.notConfirmed")}</td><td><Badge>{label(context.order.currentStage)}</Badge></td><td><span className={`order-health-label health-${health.status.toLowerCase().replaceAll(" ", "-")}`}>{label(health.status)}</span><small>{text(health.reason)}</small></td><td>{text(context.order.owner)}</td><td>{milestone ? <><strong>{text(milestone.label)}</strong><small>{formatDate(milestone.targetDate)}</small></> : t("common.notConfirmed")}</td><td><span className="order-next-cell">{text(context.project?.next ?? t("order.nextMilestoneFallback"))}</span></td></tr>;
      })}{rows.length === 0 && <tr><td colSpan={11} className="order-empty-row">{t("order.noOrders")}</td></tr>}</tbody></table></div>
      <p className="order-demo-note">{t("common.demoWorkspace")} · {t("order.demoNotice")}</p>
    </Card>
  </div>;
}
