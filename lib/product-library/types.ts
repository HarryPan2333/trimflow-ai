import type { LocalizedText } from "../i18n";

export type SpecStatus = "pending" | "confirmed" | "not_applicable";
export type TypedSpecValue =
  | { kind: "text"; value: LocalizedText }
  | { kind: "number"; value: number; unitCode?: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "option"; optionCodes: string[] };

export type ProductCategory = { id: string; code: string; name: LocalizedText; parentId?: string; sortOrder: number; status: "active" | "archived" };
export type Product = { id: string; productCode: string; name: LocalizedText; description: LocalizedText; categoryId: string; ownerId?: string; designerId?: string; tagCodes: string[]; status: "active" | "archived"; heroAssetId?: string; createdAt: string; updatedAt: string };
export type ProductVariant = { id: string; productId: string; variantCode: string; currentRevisionId: string; status: "active" | "archived" };
export type SpecificationDefinition = { id: string; code: string; label: LocalizedText; dataType: TypedSpecValue["kind"]; unitCode?: string; categoryIds: string[]; optionCodes?: string[]; required?: boolean };
export type SpecificationValue = { definitionId: string; status: SpecStatus; value?: TypedSpecValue; sourceNote?: LocalizedText };
export type VariantConfiguration = { material?: string; size?: string; width?: number; length?: number; color?: string; pantone?: string; finish?: string; surfaceTreatment?: string; logoMethod?: string; extraSpecifications: SpecificationValue[] };
export type DesignRevision = { id: string; variantId: string; revisionNumber: number; previousRevisionId?: string; configuration: VariantConfiguration; processIds: string[]; testRequirementIds: string[]; assetIds: string[]; changeReason: LocalizedText; author: string; status: "draft" | "review" | "approved" | "archived"; createdAt: string; approvedAt?: string };
export type ProductAsset = { id: string; productId: string; variantId?: string; revisionId?: string; kind: "image" | "technical_drawing" | "pdf" | "cad" | "3d_model" | "reference" | "certificate" | "test_report"; fileRef: string; assetVersion: string; description: LocalizedText; uploadedBy: string; createdAt: string; visibility: "internal" | "customer_eligible"; reviewStatus: "draft" | "approved" };
export type ProcessDefinition = { id: string; code: string; name: LocalizedText };
export type ProductProcess = { id: string; revisionId: string; processId: string; sequence: number; customizable: boolean; customerSummary: LocalizedText; internalTechnicalNote: LocalizedText; factoryDependencyId?: string };
export type Factory = { id: string; code: string; name: LocalizedText; region: LocalizedText; status: "active" | "inactive"; internalNote: LocalizedText };
export type CapabilityStatus = "supported" | "unsupported" | "unverified";
export type Range = { min: number; max: number; unit: string };
export type FactoryCapability = { id: string; factoryId: string; productId: string; variantId?: string; materialCodes: string[]; processIds: string[]; dimensionalRanges: Range[]; moqRange?: Range; sampleLeadDays?: Range; productionLeadDays?: Range; status: CapabilityStatus; limitations: LocalizedText; verifiedAt?: string };
export type TestDefinition = { id: string; code: string; name: LocalizedText; method?: string };
export type ProductTestRequirement = { id: string; revisionId: string; testId: string; threshold: LocalizedText; status: SpecStatus; source: LocalizedText };
export type FactoryTestCapability = { id: string; factoryId: string; testId: string; mode: "in_house" | "external_partner"; status: CapabilityStatus };
export type Certification = { id: string; name: LocalizedText; issuer: LocalizedText; validUntil?: string; evidenceAssetId?: string; status: "unverified" | "verified" };
export type CertificationScope = { id: string; certificationId: string; targetType: "factory" | "material" | "product" | "variant"; targetId: string; note: LocalizedText };
export type SellingPoint = { featureCode: string; explanation: LocalizedText; evidenceStatus: "unverified" | "documented"; variantId?: string };
export type SalesProductProfile = { id: string; productId: string; sellingPoints: SellingPoint[]; applications: LocalizedText[]; customerFit: LocalizedText; marketFeedback: LocalizedText; internalSalesNote: LocalizedText };
export type PriceGuidanceTier = { minQuantity: number; unitPrice: number; unit: string };
export type CommercialProfile = { id: string; productId: string; variantId?: string; moqGuidance?: number; sampleLeadDays?: Range; productionLeadDays?: Range; currency: "USD" | "EUR" | "CNY"; referencePrice?: number; referenceTiers: PriceGuidanceTier[]; validUntil?: string; source: LocalizedText; updatedAt: string; internalCommercialNote: LocalizedText };
export type ProductPublication = { id: string; productId: string; variantId: string; revisionId: string; status: "draft" | "published" | "withdrawn" | "archived"; name: LocalizedText; description: LocalizedText; publishedProductCode: string; publishedVariantCode: string; publishedConfiguration: VariantConfiguration; sellingPoints: LocalizedText[]; applications: LocalizedText[]; assetIds: string[]; publishedAssets: Array<{ assetId: string; fileRef: string }>; options: { showProductCode: boolean; showMoq: boolean; showLeadTime: boolean; showReferencePrice: boolean; showProcess: boolean }; publishedMoq?: number; publishedLeadTimeDays?: { min: number; max: number }; publishedReferencePrice?: { currency: "USD" | "EUR" | "CNY"; amount: number }; publishedProcessSummaries?: LocalizedText[]; publishedAt?: string };
export type ProjectProduct = { id: string; projectId: number; productId: string; variantId?: string; source: "library" | "legacy_sample"; applicationNote: LocalizedText; proposalStatus: "candidate" | "proposed" | "sampling" | "selected" | "rejected"; createdAt: string };
export type ProductReference = { productId: string; variantId?: string; designRevisionId?: string };
export type ProductConfigurationSnapshot = { schemaVersion: 1; capturedAt: string; source: ProductReference; productCode: string; productName: LocalizedText; variantCode?: string; categoryId: string; specificationRows: Array<{ code: string; label: LocalizedText; status: SpecStatus; value?: TypedSpecValue }> };
export type ProductLibraryData = { categories: ProductCategory[]; products: Product[]; variants: ProductVariant[]; specificationDefinitions: SpecificationDefinition[]; revisions: DesignRevision[]; assets: ProductAsset[]; processes: ProcessDefinition[]; productProcesses: ProductProcess[]; factories: Factory[]; factoryCapabilities: FactoryCapability[]; tests: TestDefinition[]; testRequirements: ProductTestRequirement[]; factoryTestCapabilities: FactoryTestCapability[]; certifications: Certification[]; certificationScopes: CertificationScope[]; salesProfiles: SalesProductProfile[]; commercialProfiles: CommercialProfile[]; publications: ProductPublication[]; projectProducts: ProjectProduct[] };
