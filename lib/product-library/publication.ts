import type { LocalizedText } from "../i18n";
import { productValue } from "../i18n/product-values";
import type { ProductLibraryData } from "./types";

export type CustomerProductDTO = {
  productId: string;
  name: LocalizedText;
  description: LocalizedText;
  productCode?: string;
  variantCode: string;
  imageRefs: string[];
  specifications: Array<{ label: LocalizedText; value: LocalizedText }>;
  sellingPoints: LocalizedText[];
  applications: LocalizedText[];
  moq?: number;
  leadTimeDays?: { min: number; max: number };
  referencePrice?: { currency: string; amount: number };
  processSummaries?: LocalizedText[];
};

// This constructs a new allowlisted object; no internal record is spread into customer data.
export function createCustomerProductDTO(data: ProductLibraryData, productId: string, variantId: string): CustomerProductDTO | undefined {
  const publication = data.publications.find((item) => item.productId === productId && item.variantId === variantId && item.status === "published");
  if (!publication) return undefined;
  const product = data.products.find((item) => item.id === productId && item.status === "active");
  const variant = data.variants.find((item) => item.id === variantId && item.productId === productId && item.status === "active");
  const revision = data.revisions.find((item) => item.id === publication.revisionId && item.variantId === variantId && item.status === "approved");
  if (!product || !variant || !revision) return undefined;
  const config = publication.publishedConfiguration;
  const specs: CustomerProductDTO["specifications"] = [];
  const safe = (label: LocalizedText, value: string | number | undefined) => {
    if (value !== undefined && value !== "") specs.push({ label, value: productValue(String(value)) });
  };
  safe({ zh: "材质", en: "Material" }, config.material);
  safe({ zh: "尺寸", en: "Size" }, config.size);
  safe({ zh: "宽度", en: "Width" }, config.width === undefined ? undefined : `${config.width} mm`);
  safe({ zh: "长度", en: "Length" }, config.length === undefined ? undefined : `${config.length} cm`);
  safe({ zh: "颜色", en: "Color" }, config.color);
  safe({ zh: "色号", en: "Pantone" }, config.pantone);
  safe({ zh: "表面处理", en: "Finish" }, config.finish);
  const imageRefs = publication.publishedAssets.flatMap((item) => {
    const asset = data.assets.find((entry) => entry.id === item.assetId && entry.productId === productId && entry.kind === "image" && entry.visibility === "customer_eligible" && entry.reviewStatus === "approved");
    return asset && /^\/products\/[a-z0-9-]+\.(?:svg|png|webp|jpe?g)$/i.test(item.fileRef) ? [item.fileRef] : [];
  });
  const result: CustomerProductDTO = {
    productId,
    name: { zh: publication.name.zh, en: publication.name.en },
    description: { zh: publication.description.zh, en: publication.description.en },
    variantCode: publication.publishedVariantCode,
    imageRefs,
    specifications: specs,
    sellingPoints: publication.sellingPoints.map((item) => ({ zh: item.zh, en: item.en })),
    applications: publication.applications.map((item) => ({ zh: item.zh, en: item.en })),
  };
  if (publication.options.showProductCode) result.productCode = publication.publishedProductCode;
  if (publication.options.showMoq && publication.publishedMoq !== undefined) result.moq = publication.publishedMoq;
  if (publication.options.showLeadTime && publication.publishedLeadTimeDays) result.leadTimeDays = { ...publication.publishedLeadTimeDays };
  if (publication.options.showReferencePrice && publication.publishedReferencePrice) result.referencePrice = { ...publication.publishedReferencePrice };
  if (publication.options.showProcess) result.processSummaries = publication.publishedProcessSummaries?.map((item) => ({ zh: item.zh, en: item.en })) ?? [];
  return result;
}
