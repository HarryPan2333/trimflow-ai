import { Badge } from "../ui/primitives";

const intelligence = [
  { tag: "产品趋势", title: "防水辅料需求保持活跃", detail: "户外与运动服项目正在关注洗后防泼水表现及轻量化结构。" },
  { tag: "材料趋势", title: "再生材料证明成为前置问题", detail: "客户在进入正式报价前，更频繁要求说明材料来源与测试口径。" },
  { tag: "客户信号", title: "多产品开发适合分批确认", detail: "瑜伽服系列仍有多项规格待确认，建议先锁定高优先级 SKU。" },
];

export function MarketIntelligence() {
  return (
    <section className="card command-section command-span-4">
      <div className="command-section-head"><div><h2>市场情报预览</h2><p>Market Intelligence Preview</p></div><Badge>Mock Preview</Badge></div>
      <div className="intelligence-list">{intelligence.map((item) => <article key={item.title}><span>{item.tag}</span><strong>{item.title}</strong><p>{item.detail}</p></article>)}</div>
      <p className="prototype-note">内容为原型模拟，不代表真实市场研究结论。</p>
    </section>
  );
}
