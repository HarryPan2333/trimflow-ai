"use client";

import { Badge, Card } from "../ui/primitives";
import type { SampleContext } from "./sample-data";
import { useI18n } from "../providers/language-provider";

export function SampleLogistics({ context }: { context: SampleContext }) {
  const { language, t, label, text, formatDate } = useI18n();
  const logistics = context.sample.logistics;
  const version = context.versions.find((item) => item.id === logistics?.versionId);
  const isCurrent = version?.id === context.current?.id;
  const fields = [[language === "zh" ? "快递" : "Courier", logistics?.courier], [language === "zh" ? "单号" : "Tracking Number", logistics?.trackingNumber], [language === "zh" ? "寄出日期" : "Sent Date", version?.sentDate ? formatDate(version.sentDate) : undefined], [language === "zh" ? "预计到达" : "Expected Arrival", logistics?.expectedArrival ? formatDate(logistics.expectedArrival) : undefined], [language === "zh" ? "签收日期" : "Received Date", logistics?.receivedDate ? formatDate(logistics.receivedDate) : undefined], [language === "zh" ? "目的地" : "Destination", logistics?.destination], [language === "zh" ? "收件人" : "Receiver", logistics?.receiver]];
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>{t("sample.logistics")}</h2><p>{version ? `${version.version} · ${isCurrent ? t("common.current") : t("common.notSent")}` : t("common.noRecords")}</p></div><Badge tone={logistics?.receivedDate ? "green" : version?.sentDate ? "blue" : "neutral"}>{label(logistics?.receivedDate ? "Delivered" : version?.sentDate ? "In Transit" : "Pending")}</Badge></div><dl className="sample-resource-fields">{fields.map(([field, value]) => <div key={field}><dt>{field}</dt><dd>{value ? text(value) : t("common.notConfirmed")}</dd></div>)}</dl><p className="sample-resource-note">{t("sample.demoLogistics")}</p></Card>;
}

export function SampleCost({ context }: { context: SampleContext }) {
  const { language, t } = useI18n();
  const cost = context.sample.developmentCost;
  const fields: Array<[string, number | undefined]> = [[language === "zh" ? "样品费" : "Sample Fee", cost?.sampleFee], [language === "zh" ? "模具费" : "Mould Fee", cost?.mouldFee], [language === "zh" ? "快递费" : "Courier Fee", cost?.courierFee], [language === "zh" ? "测试费" : "Testing Fee", cost?.testingFee], [language === "zh" ? "其他" : "Other", cost?.other]];
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>{t("sample.developmentCost")}</h2><p>{language === "zh" ? "累计资源投入" : "Cumulative development investment"}</p></div><Badge>{t("common.syntheticData")}</Badge></div><dl className="sample-resource-fields">{fields.map(([field, value]) => <div key={field}><dt>{field}</dt><dd>{value === undefined ? t("common.notConfirmed") : `${cost?.currency} ${value.toFixed(2)}`}</dd></div>)}</dl><div className="sample-cost-total"><span>{fields.some(([, value]) => value === undefined) ? (language === "zh" ? "已记录费用小计" : "Recorded Subtotal") : (language === "zh" ? "合计" : "Total")}</span><strong>{cost?.currency} {fields.reduce((sum, [, value]) => sum + (value ?? 0), 0).toFixed(2)}</strong></div><p className="sample-resource-note">{t("sample.demoCosts")}</p></Card>;
}

export function DesignInOpportunity({ context }: { context: SampleContext }) {
  const { language, t, text } = useI18n();
  const design = context.sample.designIn;
  if (!design) return <Card className="sample-section"><div className="sample-section-head"><h2>{t("sample.designIn")}</h2><Badge>Mock</Badge></div><p className="sample-empty">{t("sample.noDesignIn")}</p></Card>;
  const fields = [[language === "zh" ? "客户构想" : "Customer Idea", design.customerIdea], [language === "zh" ? "应用" : "Application", design.application], [language === "zh" ? "参考" : "Reference", design.reference], [language === "zh" ? "建议产品" : "Suggested Product", design.suggestedProduct], [language === "zh" ? "建议材质" : "Suggested Material", design.suggestedMaterial], [language === "zh" ? "建议工艺" : "Suggested Process", design.suggestedProcess], [language === "zh" ? "开发说明" : "Design Notes", design.notes], [language === "zh" ? "开发潜力" : "Development Potential", design.potential]];
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>{t("sample.designIn")}</h2><p>{language === "zh" ? "从客户构想到可评审的产品方案" : "Turn the client concept into a reviewable product proposal"}</p></div><Badge tone="blue">Mock Concept</Badge></div><dl className="sample-design-grid">{fields.map(([field, value]) => <div key={field}><dt>{field}</dt><dd>{text(value)}</dd></div>)}</dl></Card>;
}
