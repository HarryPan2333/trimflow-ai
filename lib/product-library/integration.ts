import type { SampleVersion } from "../mock-data/types";
import type { LocalizedText } from "../i18n";
import type { ProductConfigurationSnapshot, ProductLibraryData, ProjectProduct, SpecStatus, TypedSpecValue } from "./types";
import { getCurrentRevision, getProductById } from "./selectors";
import { isValidVariantReference } from "./validation";

const label = (code: string) => ({ zh: code, en: code });
function legacyStatus(value: string): SpecStatus { return value === "Pending" || value === "待确认" ? "pending" : value === "Not Required" ? "not_applicable" : "confirmed"; }

export function createProductSnapshot(data: ProductLibraryData, productId: string, variantId?: string, capturedAt = "2026-08-02"): ProductConfigurationSnapshot | undefined {
  const product = getProductById(data, productId);
  if (!product || !isValidVariantReference(data, productId, variantId)) return undefined;
  const variant = variantId ? data.variants.find((item) => item.id === variantId) : undefined;
  const revision = variantId ? getCurrentRevision(data, variantId) : undefined;
  const config = revision?.configuration;
  const rows: ProductConfigurationSnapshot["specificationRows"] = [];
  const addText = (code: string, value?: string) => { if (value !== undefined) rows.push({ code, label: label(code), status: "confirmed", value: { kind: "text", value: { zh: value, en: value } } }); };
  addText("material", config?.material); addText("size", config?.size); addText("color", config?.color); addText("pantone", config?.pantone); addText("finish", config?.finish); addText("surfaceTreatment", config?.surfaceTreatment); addText("logoMethod", config?.logoMethod);
  if (config?.width !== undefined) rows.push({ code: "width", label: label("width"), status: "confirmed", value: { kind: "number", value: config.width, unitCode: "mm" } });
  if (config?.length !== undefined) rows.push({ code: "length", label: label("length"), status: "confirmed", value: { kind: "number", value: config.length, unitCode: "cm" } });
  for (const entry of config?.extraSpecifications ?? []) {
    const definition = data.specificationDefinitions.find((item) => item.id === entry.definitionId);
    rows.push({ code: definition?.code ?? entry.definitionId, label: definition?.label ?? label(entry.definitionId), status: entry.status, value: entry.value ? structuredClone(entry.value) : undefined });
  }
  return { schemaVersion: 1, capturedAt, source: { productId, variantId, designRevisionId: revision?.id }, productCode: product.productCode, productName: { ...product.name }, variantCode: variant?.variantCode, categoryId: product.categoryId, specificationRows: rows };
}

// Physical sample versions copy their own specifications, never a live catalog view.
export function createSampleVersionSnapshot(data: ProductLibraryData, version: SampleVersion, productId: string, variantId?: string): ProductConfigurationSnapshot | undefined {
  const base = createProductSnapshot(data, productId, variantId, version.createdAt);
  if (!base) return undefined;
  const rows = Object.entries(version.specifications ?? {}).map(([code, entry]) => ({ code, label: label(code), status: legacyStatus(entry.status), value: legacyStatus(entry.status) === "confirmed" ? { kind: "text" as const, value: { zh: entry.value, en: entry.value } } : undefined }));
  return { ...base, specificationRows: rows.length ? rows : base.specificationRows };
}

export function createLegacyTransactionSnapshot(data: ProductLibraryData, productId: string, soldName: string, specification: string, capturedAt: string, variantId?: string): ProductConfigurationSnapshot | undefined {
  const base = createProductSnapshot(data, productId, variantId, capturedAt);
  if (!base) return undefined;
  const sold: TypedSpecValue = { kind: "text", value: { zh: specification, en: specification } };
  return { ...base, source: { productId, variantId }, productName: { zh: soldName, en: base.productName.en }, specificationRows: [{ code: "sold_specification", label: { zh: "成交规格", en: "Sold Specification" }, status: "confirmed", value: sold }] };
}

export function getSoldSpecification(snapshot?: ProductConfigurationSnapshot): LocalizedText | undefined {
  const value = snapshot?.specificationRows.find((row) => row.code === "sold_specification")?.value;
  return value?.kind === "text" ? value.value : undefined;
}

export function addProductToProject(data: ProductLibraryData, input: Omit<ProjectProduct, "id" | "createdAt">): ProductLibraryData {
  if (!isValidVariantReference(data, input.productId, input.variantId)) return data;
  if (data.projectProducts.some((item) => item.projectId === input.projectId && item.productId === input.productId && item.variantId === input.variantId)) return data;
  const relation: ProjectProduct = { ...input, id: `project-product-${input.projectId}-${input.productId}-${input.variantId ?? "family"}`, createdAt: new Date().toISOString() };
  return { ...data, projectProducts: [...data.projectProducts, relation] };
}
