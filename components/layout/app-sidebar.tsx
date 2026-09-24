"use client";

import type { Language, TranslationKey } from "../../lib/i18n";
import { useI18n } from "../providers/language-provider";

export type WorkspaceView =
  | "dashboard"
  | "clients"
  | "projects"
  | "products"
  | "samples"
  | "quotations"
  | "orders"
  | "fulfillment"
  | "todos"
  | "reports"
  | "ai"
  | "templates"
  | "settings";

export type InterfaceLanguage = Language;

export const workspaceNavigation: Array<{
  id: WorkspaceView;
  label: string;
  en: string;
  icon: string;
  key: TranslationKey;
  placement: "primary" | "bottom";
}> = [
  { id: "dashboard", key: "nav.dashboard", label: "工作台", en: "Workspace", icon: "⌂", placement: "primary" },
  { id: "clients", key: "nav.clients", label: "客户与品牌", en: "Clients & Brands", icon: "◎", placement: "primary" },
  { id: "projects", key: "nav.projects", label: "销售项目", en: "Sales Projects", icon: "▦", placement: "primary" },
  { id: "products", key: "nav.products", label: "产品资源库", en: "Product Library", icon: "◇", placement: "primary" },
  { id: "samples", key: "nav.samples", label: "样品中心", en: "Sample Center", icon: "◈", placement: "primary" },
  { id: "quotations", key: "nav.quotations", label: "报价中心", en: "Quotation Center", icon: "¥", placement: "primary" },
  { id: "orders", key: "nav.orders", label: "订单中心", en: "Order Center", icon: "▤", placement: "primary" },
  { id: "fulfillment", key: "nav.fulfillment", label: "交付与出货", en: "Delivery & Shipment", icon: "↗", placement: "primary" },
  { id: "todos", key: "nav.todos", label: "待办事项", en: "Tasks", icon: "✓", placement: "primary" },
  { id: "reports", key: "nav.reports", label: "报告中心", en: "Reports", icon: "▥", placement: "primary" },
  { id: "ai", key: "nav.ai", label: "AI 助手", en: "AI Assistant", icon: "✦", placement: "primary" },
  { id: "templates", key: "nav.templates", label: "模板中心", en: "Templates", icon: "▧", placement: "bottom" },
  { id: "settings", key: "nav.settings", label: "设置", en: "Settings", icon: "⚙", placement: "bottom" },
];

type AppSidebarProps = {
  activeView: WorkspaceView;
  language: InterfaceLanguage;
  todoCount: number;
  onNavigate: (view: WorkspaceView) => void;
};

export function AppSidebar({ activeView, language, todoCount, onNavigate }: AppSidebarProps) {
  const { t, text } = useI18n();
  const primaryItems = workspaceNavigation.filter((item) => item.placement === "primary");
  const bottomItems = workspaceNavigation.filter((item) => item.placement === "bottom");

  const renderItem = (item: (typeof workspaceNavigation)[number]) => (
    <button
      key={item.id}
      className={activeView === item.id ? "active" : ""}
      onClick={() => onNavigate(item.id)}
    >
      <span className="nav-icon">{item.icon}</span>
      <span>{t(item.key)}</span>
      {item.id === "todos" && <b>{todoCount}</b>}
    </button>
  );

  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate("dashboard")}>
        <span className="brand-mark">T</span>
        <span>
          <strong>TrimFlow AI</strong>
          <small>{language === "zh" ? "服装辅料外贸销售助手" : "AI Trim Export Sales Assistant"}</small>
        </span>
      </button>
      <div className="workspace-select">
        <span className="client-avatar small-avatar">TF</span>
        <div>
          <strong>{t("sidebar.team")}</strong>
          <small>{t("sidebar.salesWorkspace")}</small>
        </div>
        <span>⌄</span>
      </div>
      <nav className="sidebar-primary">{primaryItems.map(renderItem)}</nav>
      <div className="sidebar-spacer" />
      <nav className="bottom-nav">{bottomItems.map(renderItem)}</nav>
      <div className="user-card">
        <span className="user-avatar">{language === "zh" ? "陈" : "CC"}</span>
        <div>
          <strong>{text("陈晨")}</strong>
          <small>{t("sidebar.role")}</small>
        </div>
        <button aria-label={language === "zh" ? "打开用户菜单" : "Open user menu"}>⋯</button>
      </div>
    </aside>
  );
}
