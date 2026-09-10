import { Badge, Card } from "../ui/primitives";
import { emptyValue, getSpecificationRows } from "./sample-data";
import type { SampleContext } from "./sample-data";

export function SampleSpecification({ context }: { context: SampleContext }) {
  const rows = getSpecificationRows(context);
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>产品规格 / Product Specification</h2><p>{context.current?.version} · 当前版本依据</p></div><Badge>{rows.filter((row) => row.status !== "Pending").length} / {rows.length} 已明确</Badge></div><div className="sample-spec-grid">{rows.map((row) => <div key={row.key} className={row.status === "Pending" ? "spec-pending" : ""}><dt>{row.label}</dt><dd>{row.value || emptyValue}</dd><span>{row.status === "Pending" ? "待确认 / Pending Data" : row.status === "Not Required" ? "已确认不需要 / Not Required" : "已确认 / Confirmed Data"}</span></div>)}</div></Card>;
}
