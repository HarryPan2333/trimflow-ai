import type { BusinessCase } from "./types";
import { mockProductLibrary } from "./product-library";
import { createLegacyTransactionSnapshot, createSampleVersionSnapshot } from "../product-library/integration";

const sampleProductIds: Record<string, { productId: string; variantId?: string }> = {
  "SP-NAS-2407": { productId: "prod-waterproof" }, // Mixed lengths and colors remain family-level.
  "SP-EFC-2411": { productId: "prod-snap", variantId: "var-snap-brass" },
  "SP-EYW-2502-ZIP": { productId: "prod-invisible" }, // Sand/Sage are not split into separate historical samples.
  "SP-EYW-2502-LOCK": { productId: "prod-cord" },
  "SP-EYW-2502-WEB": { productId: "prod-tape" },
};
const quotationProductIds: Record<string, { productId: string; variantId?: string; sampleVersionId: string; seriesId: string }> = {
  "QT-NAS-2407-V1": { productId: "prod-waterproof", sampleVersionId: "SP-NAS-2407-V2", seriesId: "series-nas-waterproof" },
  "QT-NAS-2407-V2": { productId: "prod-waterproof", sampleVersionId: "SP-NAS-2407-V3", seriesId: "series-nas-waterproof" },
  "QT-EFC-2411-V1": { productId: "prod-snap", variantId: "var-snap-brass", sampleVersionId: "SP-EFC-2411-V2", seriesId: "series-efc-snap" },
};

export function withProductLibraryLinks(cases: BusinessCase[]): BusinessCase[] {
  return cases.map((item) => {
    const samples = item.samples.map((sample) => ({ ...sample, ...sampleProductIds[sample.id] }));
    const sampleVersions = item.sampleVersions.map((version) => {
      const reference = sampleProductIds[version.sampleId];
      if (!reference) return version;
      const snapshot = createSampleVersionSnapshot(mockProductLibrary, version, reference.productId, reference.variantId);
      // Existing physical versions predate this library; their exact source revision is not evidenced.
      const historicalSnapshot = snapshot ? { ...snapshot, source: { productId: reference.productId, variantId: reference.variantId } } : undefined;
      return { ...version, configurationSnapshot: historicalSnapshot };
    });
    const quotations = item.quotations.map((quotation) => {
      const reference = quotationProductIds[quotation.id];
      if (!reference) return quotation;
      return {
        ...quotation,
        quotationSeriesId: reference.seriesId,
        lineItems: quotation.lineItems?.map((line) => ({ ...line, productId: reference.productId, variantId: reference.variantId, sampleVersionId: reference.sampleVersionId, configurationSnapshot: createLegacyTransactionSnapshot(mockProductLibrary, reference.productId, line.product, line.specification, quotation.issuedAt, reference.variantId) })),
      };
    });
    const orderLines = item.orderLines.map((line) => {
      const order = item.purchaseOrders.find((entry) => entry.id === line.purchaseOrderId);
      const quotation = order && quotations.find((entry) => entry.id === order.quotationId);
      const source = quotation?.lineItems?.find((entry) => entry.productId);
      return { ...line, productId: source?.productId, variantId: source?.variantId, designRevisionId: source?.designRevisionId, sampleVersionId: source?.sampleVersionId, quotationLineItemId: source?.id, configurationSnapshot: source?.productId ? createLegacyTransactionSnapshot(mockProductLibrary, source.productId, line.product, line.specification, order?.poDate ?? quotation?.issuedAt ?? "2026-08-02", source.variantId) : undefined };
    });
    return { ...item, samples, sampleVersions, quotations, orderLines };
  });
}
