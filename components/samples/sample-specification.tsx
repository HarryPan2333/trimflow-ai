"use client";

import { Badge, Card } from "../ui/primitives";
import { getSpecificationRows } from "./sample-data";
import type { SampleContext } from "./sample-data";
import { useI18n } from "../providers/language-provider";

export function SampleSpecification({ context }: { context: SampleContext }) {
  const rows = getSpecificationRows(context);
  const { t, label, text } = useI18n();
  return <Card className="sample-section"><div className="sample-section-head"><div><h2>{t("sample.specification")}</h2><p>{context.current?.version} · {t("common.current")}</p></div><Badge>{t("sample.specificationStatus", { confirmed: rows.filter((row) => row.status !== "Pending").length, total: rows.length })}</Badge></div><div className="sample-spec-grid">{rows.map((row) => <div key={row.key} className={row.status === "Pending" ? "spec-pending" : ""}><dt>{label(row.key)}</dt><dd>{row.value ? text(row.value) : t("common.notConfirmed")}</dd><span>{label(row.status)}</span></div>)}</div></Card>;
}
