import { Badge, Card } from "../ui/primitives";
import { emptyValue } from "./sample-data";
import type { SampleContext } from "./sample-data";

export function SampleLogistics({ context }: { context: SampleContext }) {
  const logistics = context.sample.logistics;
  const version = context.versions.find((item) => item.id === logistics?.versionId);
  const isCurrent = version?.id === context.current?.id;
  const fields = [["快递 / Courier", logistics?.courier], ["单号 / Tracking Number", logistics?.trackingNumber], ["寄出 / Sent Date", version?.sentDate], ["预计到达 / Expected Arrival", logistics?.expectedArrival], ["签收 / Received Date", logistics?.receivedDate], ["目的地 / Destination", logistics?.destination], ["收件人 / Receiver", logistics?.receiver]];
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>样品物流 / Sample Logistics</h2><p>{version ? `${version.version} 寄样记录${isCurrent ? "" : " · 当前版本尚未寄出"}` : "尚无寄样记录"}</p></div><Badge tone={logistics?.receivedDate ? "green" : version?.sentDate ? "blue" : "neutral"}>{logistics?.receivedDate ? "Delivered" : version?.sentDate ? "In Transit" : "Pending"}</Badge></div><dl className="sample-resource-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? emptyValue}</dd></div>)}</dl><p className="sample-resource-note">Demo Data · 物流单号为虚构数据，不提供真实追踪。</p></Card>;
}

export function SampleCost({ context }: { context: SampleContext }) {
  const cost = context.sample.developmentCost;
  const fields: Array<[string, number | undefined]> = [["样品费 / Sample Fee", cost?.sampleFee], ["模具费 / Mould Fee", cost?.mouldFee], ["快递费 / Courier Fee", cost?.courierFee], ["测试费 / Testing Fee", cost?.testingFee], ["其他 / Other", cost?.other]];
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>开发成本 / Development Cost</h2><p>累计资源投入 · Prototype</p></div><Badge>Demo Data</Badge></div><dl className="sample-resource-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === undefined ? emptyValue : `${cost?.currency} ${value.toFixed(2)}`}</dd></div>)}</dl><div className="sample-cost-total"><span>{fields.some(([, value]) => value === undefined) ? "已记录费用小计" : "合计 / Total"}</span><strong>{cost?.currency} {fields.reduce((sum, [, value]) => sum + (value ?? 0), 0).toFixed(2)}</strong></div><p className="sample-resource-note">全部为演示价格，未确认费用不按零计价。</p></Card>;
}

export function DesignInOpportunity({ context }: { context: SampleContext }) {
  const design = context.sample.designIn;
  if (!design) return <Card className="sample-section"><div className="sample-section-head"><h2>设计介入 / Design-In</h2><Badge>Mock</Badge></div><p className="sample-empty">当前项目材料中尚未确认设计介入方向。</p></Card>;
  const fields = [["客户构想 / Customer Idea", design.customerIdea], ["应用 / Application", design.application], ["参考 / Reference", design.reference], ["建议产品 / Suggested Product", design.suggestedProduct], ["建议材质 / Suggested Material", design.suggestedMaterial], ["建议工艺 / Suggested Process", design.suggestedProcess], ["开发说明 / Design Notes", design.notes], ["开发潜力 / Development Potential", design.potential]];
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>设计介入 / Design-In</h2><p>从客户构想到可评审的产品方案</p></div><Badge tone="blue">Mock Concept</Badge></div><dl className="sample-design-grid">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></Card>;
}
