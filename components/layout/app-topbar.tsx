"use client";

import { useState } from "react";
import type { InterfaceLanguage } from "./app-sidebar";

export type GlobalCreateType = "project" | "sample" | "quotation" | "task";

type AppTopbarProps = {
  currentTitle: string;
  language: InterfaceLanguage;
  onLanguageChange: (language: InterfaceLanguage) => void;
  onGlobalCreate?: (type: GlobalCreateType) => void;
};

const createOptions: Array<{ id: GlobalCreateType; label: string; labelEn: string }> = [
  { id: "project", label: "新建项目", labelEn: "New Project" },
  { id: "sample", label: "新建样品", labelEn: "New Sample" },
  { id: "quotation", label: "新建报价", labelEn: "New Quotation" },
  { id: "task", label: "新建待办", labelEn: "New Task" },
];

export function AppTopbar({ currentTitle, language, onLanguageChange, onGlobalCreate }: AppTopbarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="mobile-brand">
        <span className="brand-mark">T</span>
        <strong>TrimFlow AI</strong>
      </div>
      <div className="breadcrumb">
        <span>销售工作区</span>
        <b>/</b>
        <strong>{currentTitle}</strong>
      </div>
      <div className="top-actions">
        <label className="global-search">
          <span>⌕</span>
          <input placeholder="搜索客户、项目、样品、报价..." />
        </label>
        <div className="global-create">
          <button className="global-create-trigger" onClick={() => setCreateOpen((open) => !open)} aria-expanded={createOpen}>
            ＋ 新建 <span>⌄</span>
          </button>
          {createOpen && (
            <div className="global-create-menu" role="menu">
              {createOptions.map((option) => (
                <button key={option.id} role="menuitem" onClick={() => { setCreateOpen(false); onGlobalCreate?.(option.id); }}>
                  <strong>{option.label}</strong><span>{option.labelEn}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="notification" aria-label="查看通知">
          ♧<span />
        </button>
        <div className="language-switch">
          <button
            className={language === "中文" ? "active" : ""}
            onClick={() => onLanguageChange("中文")}
          >
            中文
          </button>
          <button
            className={language === "English" ? "active" : ""}
            onClick={() => onLanguageChange("English")}
          >
            English
          </button>
        </div>
        <span className="topbar-user" aria-label="当前用户">陈</span>
      </div>
    </header>
  );
}
