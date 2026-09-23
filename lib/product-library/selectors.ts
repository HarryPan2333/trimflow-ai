import type { CommercialProfile, DesignRevision, FactoryCapability, Product, ProductLibraryData, ProductVariant } from "./types";

export const getProducts = (data: ProductLibraryData) => data.products;
export const getProductById = (data: ProductLibraryData, id: string): Product | undefined => data.products.find((item) => item.id === id);
export const getVariantsForProduct = (data: ProductLibraryData, productId: string): ProductVariant[] => data.variants.filter((item) => item.productId === productId && item.status === "active");
export const getCurrentRevision = (data: ProductLibraryData, variantId: string): DesignRevision | undefined => {
  const variant = data.variants.find((item) => item.id === variantId);
  return data.revisions.find((item) => item.id === variant?.currentRevisionId && item.variantId === variantId);
};
export const getCommercialProfile = (data: ProductLibraryData, productId: string, variantId?: string): { profile?: CommercialProfile; source: "variant" | "product" | "none" } => {
  const specific = variantId && data.commercialProfiles.find((item) => item.productId === productId && item.variantId === variantId);
  if (specific) return { profile: specific, source: "variant" };
  const base = data.commercialProfiles.find((item) => item.productId === productId && !item.variantId);
  return { profile: base, source: base ? "product" : "none" };
};
export const getFactoryCandidates = (data: ProductLibraryData, productId: string, variantId?: string): FactoryCapability[] => data.factoryCapabilities.filter((item) => item.productId === productId && (!item.variantId || item.variantId === variantId));
export const getProjectProducts = (data: ProductLibraryData, projectId: number) => data.projectProducts.filter((item) => item.projectId === projectId);
export function getProductReadiness(data: ProductLibraryData, productId: string) {
  const variants = getVariantsForProduct(data, productId);
  const approved = variants.filter((item) => getCurrentRevision(data, item.id)?.status === "approved").length;
  const published = data.publications.some((item) => item.productId === productId && item.status === "published");
  return { variants: variants.length, approved, published, ready: approved > 0 && Boolean(data.products.find((item) => item.id === productId)?.heroAssetId) };
}
