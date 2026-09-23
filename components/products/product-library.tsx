"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { PageHeader } from "../layout/page-header";
import { Badge, Button, Card } from "../ui/primitives";
import { useI18n } from "../providers/language-provider";
import { productValue } from "../../lib/i18n/product-values";
import type { ProductLibraryData } from "../../lib/product-library/types";
import { getCommercialProfile, getCurrentRevision, getProductReadiness, getProducts, getVariantsForProduct } from "../../lib/product-library/selectors";

export function ProductLibrary({ data, onOpen }: { data: ProductLibraryData; onOpen: (id: string) => void }) {
  const { t, text } = useI18n();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const rows = useMemo(() => getProducts(data).filter((product) => {
    const term = search.trim().toLowerCase();
    return (!term || `${product.name.zh} ${product.name.en} ${product.productCode}`.toLowerCase().includes(term)) && (category === "all" || product.categoryId === category) && (status === "all" || product.status === status);
  }), [data, search, category, status]);
  return <div className="product-library">
    <PageHeader title={t("product.title")} subtitle={t("product.subtitle")} />
    <div className="product-library-intro"><span>{t("product.demo")}</span><strong>{data.products.length.toString().padStart(2, "0")}</strong><p>{t("product.specSummary")}</p></div>
    <Card className="product-filters">
      <label className="product-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("product.search")} aria-label={t("product.search")} /></label>
      <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label={t("product.allCategories")}><option value="all">{t("product.allCategories")}</option>{data.categories.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{text(item.name)}</option>)}</select>
      <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={t("product.allStatuses")}><option value="all">{t("product.allStatuses")}</option><option value="active">{t("product.active")}</option><option value="archived">{t("product.archived")}</option></select>
      <span>{rows.length} / {data.products.length}</span>
    </Card>
    <div className="product-card-grid">{rows.map((product) => {
      const variants = getVariantsForProduct(data, product.id);
      const revision = variants[0] ? getCurrentRevision(data, variants[0].id) : undefined;
      const hero = data.assets.find((item) => item.id === product.heroAssetId && item.kind === "image");
      const categoryName = data.categories.find((item) => item.id === product.categoryId)?.name;
      const commercial = getCommercialProfile(data, product.id).profile;
      const readiness = getProductReadiness(data, product.id);
      return <Card className="product-card" key={product.id}>
        <button className="product-card-image" onClick={() => onOpen(product.id)} aria-label={`${t("product.open")} ${text(product.name)}`}>
          {hero && <Image src={hero.fileRef} alt={text(hero.description)} width={640} height={400} />}
          <span>{product.productCode}</span>
        </button>
        <div className="product-card-body">
          <div className="product-card-kicker"><span>{categoryName ? text(categoryName) : product.categoryId}</span><span>{product.status === "active" ? t("product.active") : t("product.archived")}</span></div>
          <h2>{text(product.name)}</h2>
          <p>{text(product.description)}</p>
          <div className="product-card-meta"><span>{variants.length === 1 ? t("product.variantsOne") : t("product.variants", { count: variants.length })}</span><span>{revision?.configuration.material ? text(productValue(revision.configuration.material)) : t("product.pending")}{revision?.configuration.size ? ` · ${revision.configuration.size}` : ""}</span></div>
          <div className="product-card-tags">{product.tagCodes.slice(0, 2).map((code) => <Badge key={code}>{text(productValue(code))}</Badge>)}</div>
          <div className="product-card-bottom"><div><small>{t("product.moqGuidance")}</small><strong>{commercial?.moqGuidance?.toLocaleString("en-US") ?? "—"}</strong></div><div><small>{t("product.productionLead")}</small><strong>{commercial?.productionLeadDays ? t("product.days", { min: commercial.productionLeadDays.min, max: commercial.productionLeadDays.max }) : "—"}</strong></div><Button variant="secondary" onClick={() => onOpen(product.id)}>{t("product.open")} →</Button></div>
          <span className="product-readiness-line">{t("product.approvedVariants", { count: readiness.approved, total: readiness.variants })}</span>
        </div>
      </Card>;
    })}</div>
    {rows.length === 0 && <Card className="product-empty">{t("product.noResults")}</Card>}
  </div>;
}
