import type { ProductLibraryData, SpecificationDefinition, SpecificationValue } from "./types";

export function isValidSpecification(definition: SpecificationDefinition, entry: SpecificationValue): boolean {
  if (definition.id !== entry.definitionId) return false;
  if (entry.status !== "confirmed") return entry.value === undefined;
  if (!entry.value || entry.value.kind !== definition.dataType) return false;
  if (entry.value.kind === "number") return Number.isFinite(entry.value.value) && (!definition.unitCode || entry.value.unitCode === definition.unitCode);
  if (entry.value.kind === "option") return !definition.optionCodes || entry.value.optionCodes.every((code) => definition.optionCodes?.includes(code));
  return true;
}

export function isValidVariantReference(data: ProductLibraryData, productId: string, variantId?: string): boolean {
  return Boolean(data.products.some((item) => item.id === productId) && (!variantId || data.variants.some((item) => item.id === variantId && item.productId === productId)));
}

export function validateProductLibrary(data: ProductLibraryData): string[] {
  const issues: string[] = [];
  const unique = (name: string, ids: string[]) => { if (new Set(ids).size !== ids.length) issues.push(`${name}: duplicate ID`); };
  unique("product", data.products.map((item) => item.id));
  unique("variant", data.variants.map((item) => item.id));
  for (const product of data.products) if (!data.categories.some((item) => item.id === product.categoryId)) issues.push(`${product.id}: category missing`);
  for (const variant of data.variants) {
    if (!data.products.some((item) => item.id === variant.productId)) issues.push(`${variant.id}: product missing`);
    if (!data.revisions.some((item) => item.id === variant.currentRevisionId && item.variantId === variant.id)) issues.push(`${variant.id}: revision missing`);
  }
  for (const revision of data.revisions) for (const value of revision.configuration.extraSpecifications) {
    const definition = data.specificationDefinitions.find((item) => item.id === value.definitionId);
    if (!definition || !isValidSpecification(definition, value)) issues.push(`${revision.id}: invalid ${value.definitionId}`);
  }
  for (const relation of data.projectProducts) if (!isValidVariantReference(data, relation.productId, relation.variantId)) issues.push(`${relation.id}: invalid product reference`);
  for (const publication of data.publications) {
    if (!isValidVariantReference(data, publication.productId, publication.variantId)) issues.push(`${publication.id}: invalid variant reference`);
    if (!data.revisions.some((item) => item.id === publication.revisionId && item.variantId === publication.variantId)) issues.push(`${publication.id}: revision missing`);
    for (const item of publication.publishedAssets) {
      if (!publication.assetIds.includes(item.assetId) || !data.assets.some((asset) => asset.id === item.assetId && asset.productId === publication.productId && asset.kind === "image")) issues.push(`${publication.id}: invalid published asset`);
    }
  }
  return issues;
}
