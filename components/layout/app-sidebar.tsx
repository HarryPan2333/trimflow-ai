"use client";

export type WorkspaceView =
  | "dashboard"
  | "clients"
  | "projects"
  | "samples"
  | "quotations"
  | "orders"
  | "fulfillment"
  | "todos"
  | "reports"
  | "ai"
  | "templates"
  | "settings";

export type InterfaceLanguage = "中文" | "English";

export const workspaceNavigation: Array<{
  id: WorkspaceView;
  label: string;
  en: string;
  icon: string;
  placement: "primary" | "bottom";
}> = [
  { id: "dashboard", label: "工作台", en: "Workspace", icon: "⌂", placement: "primary" },
  { id: "clients", label: "客户与品牌", en: "Clients & Brands", icon: "◎", placement: "primary" },
  { id: "projects", label: "销售项目", en: "Sales Projects", icon: "▦", placement: "primary" },
  { id: "samples", label: "样品中心", en: "Sample Center", icon: "◈", placement: "primary" },
  { id: "quotations", label: "报价中心", en: "Quotation Center", icon: "¥", placement: "primary" },
  { id: "orders", label: "订单中心", en: "Order Center", icon: "▤", placement: "primary" },
  { id: "fulfillment", label: "交付与出货", en: "Delivery & Shipment", icon: "↗", placement: "primary" },
  { id: "todos", label: "待办事项", en: "Tasks", icon: "✓", placement: "primary" },
  { id: "reports", label: "周报中心", en: "Weekly Reports", icon: "▥", placement: "primary" },
  { id: "ai", label: "AI 助手", en: "AI Assistant", icon: "✦", placement: "primary" },
  { id: "templates", label: "模板中心", en: "Templates", icon: "▧", placement: "bottom" },
  { id: "settings", label: "设置", en: "Settings", icon: "⚙", placement: "bottom" },
];

type AppSidebarProps = {
  activeView: WorkspaceView;
  language: InterfaceLanguage;
  todoCount: number;
  onNavigate: (view: WorkspaceView) => void;
};

export function AppSidebar({ activeView, language, todoCount, onNavigate }: AppSidebarProps) {
  const primaryItems = workspaceNavigation.filter((item) => item.placement === "primary");
  const bottomItems = workspaceNavigation.filter((item) => item.placement === "bottom");

  const renderItem = (item: (typeof workspaceNavigation)[number]) => (
    <button
      key={item.id}
      className={activeView === item.id ? "active" : ""}
      onClick={() => onNavigate(item.id)}
    >
      <span className="nav-icon">{item.icon}</span>
      <span>{language === "中文" ? item.label : item.en}</span>
      {item.id === "todos" && <b>{todoCount}</b>}
    </button>
  );

  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate("dashboard")}>
        <span className="brand-mark">T</span>
        <span>
          <strong>TrimFlow AI</strong>
          <small>服装辅料外贸销售助手</small>
        </span>
      </button>
      <div className="workspace-select">
        <span className="client-avatar small-avatar">TF</span>
        <div>
          <strong>TrimFlow 外贸团队</strong>
          <small>销售工作区</small>
        </div>
        <span>⌄</span>
      </div>
      <nav className="sidebar-primary">{primaryItems.map(renderItem)}</nav>
      <div className="sidebar-spacer" />
      <nav className="bottom-nav">{bottomItems.map(renderItem)}</nav>
      <div className="user-card">
        <span className="user-avatar">陈</span>
        <div>
          <strong>陈晨</strong>
          <small>外贸销售经理</small>
        </div>
        <button aria-label="打开用户菜单">⋯</button>
      </div>
    </aside>
  );
}
