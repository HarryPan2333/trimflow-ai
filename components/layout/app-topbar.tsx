"use client";

import { useState } from "react";
import type { InterfaceLanguage } from "./app-sidebar";
import { useI18n } from "../providers/language-provider";

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
  const { t } = useI18n();
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="mobile-brand">
        <span className="brand-mark">T</span>
        <strong>TrimFlow AI</strong>
      </div>
      <div className="breadcrumb">
        <span>{t("common.workspace")}</span>
        <b>/</b>
        <strong>{currentTitle}</strong>
      </div>
      <div className="top-actions">
        <label className="global-search">
          <span>⌕</span>
          <input placeholder={t("common.search")} />
        </label>
        <div className="global-create">
          <button className="global-create-trigger" onClick={() => setCreateOpen((open) => !open)} aria-expanded={createOpen}>
            ＋ {t("topbar.create")} <span>⌄</span>
          </button>
          {createOpen && (
            <div className="global-create-menu" role="menu">
              {createOptions.map((option) => (
                <button key={option.id} role="menuitem" onClick={() => { setCreateOpen(false); onGlobalCreate?.(option.id); }}>
                  <strong>{language === "zh" ? option.label : option.labelEn}</strong>{language === "zh" && <span>{option.labelEn}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="notification" aria-label={t("topbar.notifications")}>
          ♧<span />
        </button>
        <div className="language-switch">
          <button
            className={language === "zh" ? "active" : ""}
            onClick={() => onLanguageChange("zh")}
          >
            中文
          </button>
          <button
            className={language === "en" ? "active" : ""}
            onClick={() => onLanguageChange("en")}
          >
            English
          </button>
        </div>
        <span className="topbar-user" aria-label={t("topbar.currentUser")}>{language === "zh" ? "陈" : "CC"}</span>
      </div>
    </header>
  );
}
