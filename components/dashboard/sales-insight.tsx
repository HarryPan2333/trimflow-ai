import { Badge } from "../ui/primitives";
import type { DashboardData } from "./dashboard-data";
import { useI18n } from "../providers/language-provider";

export function SalesInsight({ data }: { data: DashboardData }) {
  const { language, t, text } = useI18n();
  const negotiation = data.projects.find((item) => item.lifecycleStage === "negotiation");
  const sample = data.projects.find((item) => item.lifecycleStage === "sample");
  const insights = language === "zh" ? [
    { type: "定制", title: "先确认交换条件，再讨论降价", text: negotiation ? `${text(negotiation.customer)} 的报价仍在谈判中。建议围绕数量阶梯、标准包装和付款条件组织下一轮对话。` : "当前没有谈判中的报价。" },
    { type: "控制", title: "把待确认规格变成客户选择题", text: sample ? `${text(sample.customer)} 有多项规格尚未收口。将问题按 SKU 分组并提供选项，有助于缩短确认周期。` : "当前没有打样中的项目。" },
  ] : [
    { type: "Tailored", title: "Confirm trade-offs before discussing a price reduction", text: negotiation ? `${negotiation.customer} is still negotiating. Structure the next conversation around quantity tiers, standard packaging, and payment terms.` : "There are no quotations in negotiation." },
    { type: "Control", title: "Turn open specifications into clear client choices", text: sample ? `${sample.customer} still has open specifications. Group questions by SKU and offer controlled options to shorten confirmation time.` : "There are no projects in sampling." },
  ];
  return (
    <section className="card command-section command-span-5">
      <div className="command-section-head"><div><h2>{t("dashboard.salesInsight")}</h2><p>{language === "zh" ? "每日销售洞察 · 引导 / 定制 / 控制" : "Daily Sales Insight · Teaching / Tailored / Control"}</p></div><Badge tone="purple">{language === "zh" ? "模拟 AI" : "Mock AI"}</Badge></div>
      <div className="insight-list">{insights.map((item) => <article key={item.type}><span>{item.type}</span><strong>{item.title}</strong><p>{item.text}</p></article>)}</div>
      <p className="prototype-note">{t("common.prototypeNotice")}</p>
    </section>
  );
}
