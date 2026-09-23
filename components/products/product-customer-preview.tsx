"use client";

import Image from "next/image";
import type { CustomerProductDTO } from "../../lib/product-library/publication";
import { useI18n } from "../providers/language-provider";
import { Card } from "../ui/primitives";

// This component accepts only the published allowlisted DTO.
export function ProductCustomerPreview({ product }: { product?: CustomerProductDTO }) {
  const { t, text } = useI18n();
  return <Card className="product-preview"><div className="product-panel-heading"><span>{t("product.customerPreview")}</span><p>{t("product.previewInfo")}</p></div>{!product ? <p className="product-muted">{t("product.previewUnavailable")}</p> : <div className="product-preview-layout">
    {product.imageRefs[0] && <Image src={product.imageRefs[0]} alt={text(product.name)} width={640} height={400} />}
    <div><small>{product.productCode}</small><h2>{text(product.name)}</h2><p>{text(product.description)}</p><dl>{product.specifications.map((row) => <div key={row.label.en}><dt>{text(row.label)}</dt><dd>{text(row.value)}</dd></div>)}</dl><div className="product-preview-points">{product.sellingPoints.map((point, index) => <p key={index}>✦ {text(point)}</p>)}</div>{product.applications.map((item, index) => <p key={index}>{text(item)}</p>)}{product.moq !== undefined && <p>{t("product.moqGuidance")}: {product.moq.toLocaleString("en-US")}</p>}{product.leadTimeDays && <p>{t("product.productionLead")}: {t("product.days", product.leadTimeDays)}</p>}{product.referencePrice && <p>{t("product.previewPrice")}: {product.referencePrice.currency} {product.referencePrice.amount}</p>}{product.processSummaries?.map((item, index) => <p key={index}>{text(item)}</p>)}</div>
  </div>}</Card>;
}
