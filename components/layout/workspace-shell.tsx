"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import type { InterfaceLanguage, WorkspaceView } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import type { GlobalCreateType } from "./app-topbar";

export type { InterfaceLanguage, WorkspaceView } from "./app-sidebar";
export type { GlobalCreateType } from "./app-topbar";
export { workspaceNavigation } from "./app-sidebar";

type WorkspaceShellProps = {
  activeView: WorkspaceView;
  currentTitle: string;
  language: InterfaceLanguage;
  todoCount: number;
  onNavigate: (view: WorkspaceView) => void;
  onLanguageChange: (language: InterfaceLanguage) => void;
  onGlobalCreate?: (type: GlobalCreateType) => void;
  embedded?: boolean;
  children: ReactNode;
};

export function WorkspaceShell({
  activeView,
  currentTitle,
  language,
  todoCount,
  onNavigate,
  onLanguageChange,
  onGlobalCreate,
  embedded = false,
  children,
}: WorkspaceShellProps) {
  return (
    <div className={`app-shell${embedded ? " embedded-mode" : ""}`}>
      <AppSidebar
        activeView={activeView}
        language={language}
        todoCount={todoCount}
        onNavigate={onNavigate}
      />
      <div className="main-shell">
        <AppTopbar
          currentTitle={currentTitle}
          language={language}
          onLanguageChange={onLanguageChange}
          onGlobalCreate={onGlobalCreate}
        />
        <main>{children}</main>
      </div>
    </div>
  );
}
