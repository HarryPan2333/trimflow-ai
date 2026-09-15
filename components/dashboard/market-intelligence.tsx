import { Badge } from "../ui/primitives";
import { useI18n } from "../providers/language-provider";

const intelligence = [
  { tag: "产品趋势", title: "防水辅料需求保持活跃", detail: "户外与运动服项目正在关注洗后防泼水表现及轻量化结构。" },
  { tag: "材料趋势", title: "再生材料证明成为前置问题", detail: "客户在进入正式报价前，更频繁要求说明材料来源与测试口径。" },
  { tag: "客户信号", title: "多产品开发适合分批确认", detail: "瑜伽服系列仍有多项规格待确认，建议先锁定高优先级 SKU。" },
];

export function MarketIntelligence() {
  const { language, t } = useI18n();
  const english = [
    { tag: "Product Trend", title: "Demand for water-resistant trims remains active", detail: "Outdoor and sportswear projects are reviewing post-wash repellency and lightweight construction." },
    { tag: "Material Trend", title: "Recycled-material evidence is moving earlier", detail: "Clients increasingly request material-origin and testing details before formal quotation." },
    { tag: "Client Signal", title: "Multi-product development benefits from phased confirmation", detail: "The yoga collection still has open specifications; lock high-priority SKUs first." },
  ];
  const items = language === "zh" ? intelligence : english;
  return (
    <section className="card command-section command-span-4">
      <div className="command-section-head"><div><h2>{t("dashboard.marketIntelligence")}</h2><p>{language === "zh" ? "市场信号摘要" : "Market signal summary"}</p></div><Badge>{language === "zh" ? "模拟预览" : "Mock Preview"}</Badge></div>
      <div className="intelligence-list">{items.map((item) => <article key={item.title}><span>{item.tag}</span><strong>{item.title}</strong><p>{item.detail}</p></article>)}</div>
      <p className="prototype-note">{language === "zh" ? "内容为原型模拟，不代表真实市场研究结论。" : "Prototype content only; it does not represent real market research."}</p>
    </section>
  );
}
