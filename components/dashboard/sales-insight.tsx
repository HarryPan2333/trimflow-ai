import { Badge } from "../ui/primitives";
import type { DashboardData } from "./dashboard-data";

export function SalesInsight({ data }: { data: DashboardData }) {
  const negotiation = data.projects.find((item) => item.lifecycleStage === "negotiation");
  const sample = data.projects.find((item) => item.lifecycleStage === "sample");
  const insights = [
    { type: "Tailored", title: "先确认交换条件，再讨论降价", text: negotiation ? `${negotiation.customer} 的报价仍在谈判中。建议围绕数量阶梯、标准包装和付款条件组织下一轮对话。` : "当前没有谈判中的报价。" },
    { type: "Control", title: "把待确认规格变成客户选择题", text: sample ? `${sample.customer} 有多项规格尚未收口。将问题按 SKU 分组并提供选项，有助于缩短确认周期。` : "当前没有打样中的项目。" },
  ];
  return (
    <section className="card command-section command-span-5">
      <div className="command-section-head"><div><h2>销售洞察</h2><p>Daily Sales Insight · Teaching / Tailored / Control</p></div><Badge tone="purple">Mock AI</Badge></div>
      <div className="insight-list">{insights.map((item) => <article key={item.type}><span>{item.type}</span><strong>{item.title}</strong><p>{item.text}</p></article>)}</div>
      <p className="prototype-note">当前为原型模拟结果，尚未接入真实业务AI模型。</p>
    </section>
  );
}
