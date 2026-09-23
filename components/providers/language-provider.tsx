"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { localizeNarrative, translations, type Language, type LocalizedText, type TranslationKey, type TranslationParams } from "../../lib/i18n";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  label: (value: string) => string;
  text: (value: string | LocalizedText) => string;
  formatDate: (value: string, options?: Intl.DateTimeFormatOptions) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "trimflow-language";
const LANGUAGE_EVENT = "trimflow-language-change";

function subscribeLanguage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LANGUAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LANGUAGE_EVENT, callback);
  };
}

function readLanguage(): Language {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "zh";
}

const enumLabels: Record<string, [string, string]> = {
  "Hong Kong": ["香港", "Hong Kong"], "New York": ["纽约", "New York"], Paris: ["巴黎", "Paris"], Melbourne: ["墨尔本", "Melbourne"], Toronto: ["多伦多", "Toronto"], Canada: ["加拿大", "Canada"], Ontario: ["安大略省", "Ontario"],
  inquiry: ["询盘", "Inquiry"], requirement: ["需求确认", "Requirement"], sample: ["样品", "Sample"], quotation: ["报价", "Quotation"], negotiation: ["谈判", "Negotiation"], po: ["采购订单", "PO"], delivery: ["交付", "Delivery"], shipment: ["出货", "Shipment"],
  新询盘: ["新询盘", "New Inquiry"], 需求确认: ["需求确认", "Requirement Confirmation"], 打样中: ["打样中", "Sampling"], 报价中: ["报价中", "Quoting"], 谈判中: ["谈判中", "Negotiating"], 已确认订单: ["已确认订单", "PO Confirmed"], 暂停或流失: ["暂停或流失", "Paused / Lost"],
  待制作: ["待制作", "To Produce"], 制作中: ["制作中", "In Development"], 已完成: ["已完成", "Completed"], 已寄出: ["已寄出", "Sent"], 客户评估中: ["客户评估中", "Client Evaluation"], 需修改: ["需修改", "Revision Required"], 已确认: ["已确认", "Approved"], 已关闭: ["已关闭", "Closed"],
  Draft: ["草稿", "Draft"], "Internal Review": ["内部审核", "Internal Review"], Sent: ["已发送", "Sent"], Negotiating: ["谈判中", "Negotiating"], Accepted: ["已接受", "Accepted"], Rejected: ["已拒绝", "Rejected"], Expired: ["已过期", "Expired"],
  "PO Received": ["已收到采购订单", "PO Received"], Contract: ["合同", "Contract"], Production: ["生产", "Production"], Approval: ["审批", "Approval"], Delivery: ["交付", "Delivery"], Shipment: ["出货", "Shipment"], Payment: ["回款", "Payment"], Completed: ["已完成", "Completed"],
  "On Track": ["进度正常", "On Track"], Attention: ["需要关注", "Attention"], "At Risk": ["存在风险", "At Risk"], Blocked: ["阻塞", "Blocked"],
  良好: ["良好", "Healthy"], 关注: ["关注", "Attention"], 风险: ["风险", "At Risk"], Healthy: ["正常", "Healthy"],
  Pending: ["待处理", "Pending"], 待确认: ["待确认", "Pending Confirmation"], 未提供: ["未提供", "Not Provided"], 有冲突: ["有冲突", "Conflict"], Confirmed: ["已确认", "Confirmed"], Approved: ["已批准", "Approved"], Ready: ["已就绪", "Ready"], "Needs Review": ["需要审核", "Needs Review"], "Not Confirmed": ["尚未确认", "Not Confirmed"],
  High: ["高", "High"], Medium: ["中", "Medium"], Low: ["低", "Low"], Strategic: ["战略", "Strategic"], Important: ["重要", "Important"], Minor: ["轻微", "Minor"], Blocking: ["阻塞", "Blocking"],
  Commercial: ["商务", "Commercial"], Technical: ["技术", "Technical"], Relationship: ["关系", "Relationship"], Timing: ["时机", "Timing"], Process: ["流程", "Process"], Quality: ["质量", "Quality"], Testing: ["测试", "Testing"], Logistics: ["物流", "Logistics"],
  拉链: ["拉链", "Zipper"], 纽扣: ["纽扣", "Button"], 绳扣: ["绳扣", "Cord Lock"], 织带: ["织带", "Tape"],
  防水尼龙拉链: ["防水尼龙拉链", "Waterproof Nylon Zipper"], 金属拉链: ["金属拉链", "Metal Zipper"], 金属纽扣: ["金属纽扣", "Metal Button"], 树脂纽扣: ["树脂纽扣", "Resin Button"], 绳扣与织带: ["绳扣与织带", "Cord Locks & Tape"], 其他服装辅料: ["其他服装辅料", "Other Garment Trims"],
  Requested: ["已申请", "Requested"], "In Development": ["开发中", "In Development"], "Client Reviewing": ["客户评审中", "Client Reviewing"], "Revision Required": ["需要修改", "Revision Required"],
  "Initial Sample": ["初样", "Initial Sample"], "Development Sample": ["开发样", "Development Sample"], "Sales Sample": ["销售样", "Sales Sample"], "Bulk Approval Sample": ["大货确认样", "Bulk Approval Sample"],
  Color: ["颜色", "Color"], Size: ["尺寸", "Size"], Material: ["材质", "Material"], Logo: ["标识", "Logo"], Function: ["功能", "Function"], Design: ["设计", "Design"], Cost: ["成本", "Cost"], Other: ["其他", "Other"],
  Open: ["待处理", "Open"], Resolved: ["已处理", "Resolved"], "Not Required": ["已确认不需要", "Not Required"],
  Current: ["当前", "Current"], Planned: ["已计划", "Planned"], Shipped: ["已出货", "Shipped"], Delivered: ["已送达", "Delivered"], "In Transit": ["运输中", "In Transit"], "Not Started": ["尚未开始", "Not Started"], "In Production": ["生产中", "In Production"], Paid: ["已付款", "Paid"], Partial: ["部分付款", "Partially Paid"], Overdue: ["已逾期", "Overdue"], "Not Due": ["未到期", "Not Due"], 未到期: ["未到期", "Not Due"], Signed: ["已签署", "Signed"], Available: ["已具备", "Available"], "Ready to Send": ["可发送", "Ready to Send"], "Ready to Ship": ["可出货", "Ready to Ship"], "Needs Attention": ["需要关注", "Needs Attention"],
  Booking: ["订舱", "Booking"], "Cargo Ready": ["货物就绪", "Cargo Ready"], Departed: ["已离港", "Departed"], "Bulk Completion": ["大货完成", "Bulk Completion"], "Packing Complete": ["包装完成", "Packing Complete"], "Shipment Booking": ["出货订舱", "Shipment Booking"], "Required Delivery": ["要求交付", "Required Delivery"],
  Aligned: ["一致", "Aligned"], Close: ["接近", "Close"], Gap: ["有差距", "Gap"], Review: ["需复核", "Review"], Balanced: ["平衡", "Balanced"], Aggressive: ["积极", "Aggressive"], Conservative: ["稳健", "Conservative"],
  "Missing Requirement": ["缺失需求", "Missing Requirement"], Factory: ["工厂", "Factory"], Timeline: ["时间", "Timeline"], Compliance: ["合规", "Compliance"],
  "电话记录": ["电话记录", "Call Record"], "客户邮件": ["客户邮件", "Client Email"], "聊天记录": ["聊天记录", "Chat Record"], "内部备注": ["内部备注", "Internal Note"], "样品反馈": ["样品反馈", "Sample Feedback"], "报价反馈": ["报价反馈", "Quotation Feedback"],
  中文: ["中文", "Chinese"], 英文: ["英文", "English"], 中英对照: ["中英对照", "Bilingual"], 高: ["高", "High"], 中: ["中", "Medium"], 普通: ["普通", "Normal"], 建议: ["建议", "Minor"],
  活跃: ["活跃", "Active"], 培育中: ["培育中", "Nurturing"], 新兴: ["新兴", "Emerging"], "运动服装品牌": ["运动服装品牌", "Sportswear Brand"], "时尚品牌采购商": ["时尚品牌采购商", "Fashion Brand Buyer"],
  product: ["产品", "Product"], material: ["材质", "Material"], size: ["尺寸", "Size"], color: ["颜色", "Color"], pantone: ["色号", "Pantone"], finish: ["表面处理", "Finish"], logo: ["标识", "Logo"], logoMethod: ["标识工艺", "Logo Method"], lightSource: ["对色光源", "Light Source"], functional: ["功能要求", "Functional Requirement"], testing: ["测试要求", "Testing Requirement"], sampleQuantity: ["样品数量", "Sample Quantity"], moq: ["起订量", "MOQ"], weight: ["克重", "Weight"], logoPosition: ["Logo 位置", "Logo Position"], logoDepth: ["Logo 深度", "Logo Depth"],
  "产品类型": ["产品类型", "Product Type"], 材质: ["材质", "Material"], 颜色: ["颜色", "Color"], 尺寸: ["尺寸", "Size"], 拉链长度: ["拉链长度", "Zipper Length"], 表面处理: ["表面处理", "Surface Finish"], "定制 Logo": ["定制 Logo", "Customized Logo"], 预计数量: ["预计数量", "Estimated Quantity"], 测试标准: ["测试标准", "Testing Standard"], 目标价格: ["目标价格", "Target Price"], 目标交期: ["目标交期", "Target Delivery Date"],
};

function interpolate(value: string, params?: TranslationParams) {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

function translateNarrative(value: string | LocalizedText, language: Language) {
  if (typeof value !== "string") return value[language];
  return localizeNarrative(value, language);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore<Language>(subscribeLanguage, readLanguage, () => "zh");
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);
  const setLanguage = useCallback((next: Language) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }, []);
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key, params) => interpolate(translations[language][key], params),
    label: (raw) => enumLabels[raw]?.[language === "zh" ? 0 : 1] ?? translateNarrative(raw, language),
    text: (raw) => translateNarrative(raw, language),
    formatDate: (raw, options) => {
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return translateNarrative(raw, language);
      return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", options ?? { year: "numeric", month: "short", day: "numeric" }).format(date);
    },
  }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useI18n must be used within LanguageProvider");
  return value;
}
