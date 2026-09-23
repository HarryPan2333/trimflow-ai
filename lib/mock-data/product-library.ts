import type { LocalizedText } from "../i18n";
import type { ProductLibraryData, Product, ProductVariant, DesignRevision, SpecificationValue } from "../product-library/types";

const L = (zh: string, en: string): LocalizedText => ({ zh, en });
const day = "2026-08-02";
const product = (id: string, code: string, name: LocalizedText, description: LocalizedText, categoryId: string, tags: string[]): Product => ({ id, productCode: code, name, description, categoryId, tagCodes: tags, ownerId: "demo-sales", designerId: "demo-design", status: "active", heroAssetId: `asset-${id}`, createdAt: "2026-06-10", updatedAt: day });
const variant = (id: string, productId: string, code: string): ProductVariant => ({ id, productId, variantCode: code, currentRevisionId: `rev-${id}`, status: "active" });
const textValue = (definitionId: string, zh: string, en: string): SpecificationValue => ({ definitionId, status: "confirmed", value: { kind: "text", value: L(zh, en) } });
const numberValue = (definitionId: string, value: number, unitCode: string): SpecificationValue => ({ definitionId, status: "confirmed", value: { kind: "number", value, unitCode } });
const pending = (definitionId: string): SpecificationValue => ({ definitionId, status: "pending" });
const notApplicable = (definitionId: string): SpecificationValue => ({ definitionId, status: "not_applicable" });
const revision = (v: ProductVariant, config: DesignRevision["configuration"], status: DesignRevision["status"] = "approved", processIds: string[] = [], testRequirementIds: string[] = []): DesignRevision => ({ id: v.currentRevisionId, variantId: v.id, revisionNumber: 1, configuration: config, processIds, testRequirementIds, assetIds: [`asset-${v.productId}`], changeReason: L("演示产品初始技术版本", "Initial synthetic technical definition"), author: "Demo Design Team", status, createdAt: day, ...(status === "approved" ? { approvedAt: day } : {}) });

const products: Product[] = [
  product("prod-waterproof", "TF-ZIP-001", L("防水尼龙拉链", "Waterproof Coil Zipper"), L("适用于户外服装的低轮廓覆膜拉链家族。具体长度、颜色和拉片由变体或项目确认。", "Low-profile coated zipper family for outdoor apparel. Length, color and puller are confirmed per variant or project."), "zipper", ["water_resistant", "custom_logo"]),
  product("prod-snap", "TF-BTN-002", L("金属四合扣", "Metal Snap Button"), L("适用于时装外套的金属四合扣产品家族。", "Metal snap button family for fashion outerwear."), "button", ["premium_finish"]),
  product("prod-invisible", "TF-ZIP-003", L("隐形拉链", "Invisible Zipper"), L("适用于瑜伽服和轻量服装的隐形拉链。", "Invisible zipper for activewear and lightweight apparel."), "zipper", ["lightweight"]),
  product("prod-cord", "TF-CRD-004", L("单孔绳扣", "Single-Hole Cord Lock"), L("低轮廓单孔绳扣，可用于抽绳调节。", "Low-profile single-hole cord lock for drawcord adjustment."), "cord", ["lightweight"]),
  product("prod-tape", "TF-TAP-005", L("弹力织带", "Elastic Tape"), L("用于运动服边缘及结构连接的弹力织带。", "Elastic tape for activewear edges and construction."), "tape", ["recycled_material"]),
  product("prod-label", "TF-LBL-006", L("织唛标签", "Woven Label"), L("可用于品牌标识的织唛标签。", "Woven label for garment branding."), "label", ["custom_logo"]),
  product("prod-puller", "TF-PLR-007", L("轻量金属拉片", "Lightweight Metal Puller"), L("通用拉链拉片概念产品，具体接口需核对。", "Concept puller family; connector compatibility must be checked."), "puller", ["lightweight"]),
  product("prod-buckle", "TF-BKL-008", L("扁平调节扣", "Low-Profile Adjuster Buckle"), L("用于服装带扣调节的扁平结构。", "Low-profile adjuster for garment straps."), "buckle", ["premium_finish"]),
];
const variants: ProductVariant[] = [
  variant("var-waterproof-black", "prod-waterproof", "WP-5-BLK"), variant("var-waterproof-gray", "prod-waterproof", "WP-5-GRY"),
  variant("var-snap-brass", "prod-snap", "SNAP-15-BRS"),
  variant("var-invisible-sand", "prod-invisible", "INV-SAND"), variant("var-invisible-sage", "prod-invisible", "INV-SAGE"),
  variant("var-cord-recycled", "prod-cord", "CORD-RN"), variant("var-tape-soft", "prod-tape", "TAPE-20"),
  variant("var-label-woven", "prod-label", "LBL-WVN"), variant("var-puller-light", "prod-puller", "PULL-LT"), variant("var-buckle-flat", "prod-buckle", "BKL-FLAT"),
];
const revisions: DesignRevision[] = [
  revision(variants[0], { material: "nylon_tpu", size: "#5", color: "Black", pantone: "Black C", finish: "matte", surfaceTreatment: "TPU coating", extraSpecifications: [textValue("zipper_structure", "尼龙链牙", "Nylon coil"), pending("zipper_length")] }, "approved", ["dyeing", "coating", "assembly", "testing"], ["test-water"]),
  revision(variants[1], { material: "nylon_tpu", size: "#5", color: "Cool Gray", pantone: "Cool Gray 11 C", finish: "matte", surfaceTreatment: "TPU coating", extraSpecifications: [textValue("zipper_structure", "尼龙链牙", "Nylon coil"), pending("zipper_length")] }, "approved", ["dyeing", "coating", "assembly", "testing"], ["test-water"]),
  { ...revision(variants[2], { material: "zinc_alloy", size: "15 mm", color: "Antique brass", finish: "antique_brass", surfaceTreatment: "plating", extraSpecifications: [numberValue("button_diameter", 15, "mm"), textValue("button_structure", "四合扣", "Snap button"), notApplicable("button_holes")] }, "approved", ["molding", "plating", "assembly", "testing"], ["test-nickel"]), revisionNumber: 2, previousRevisionId: "rev-var-snap-brass-v1" },
  revision(variants[3], { material: "nylon", color: "Sand", extraSpecifications: [pending("zipper_length"), textValue("zipper_structure", "隐形结构", "Invisible construction")] }, "review", ["dyeing", "assembly"], ["test-durability"]),
  revision(variants[4], { material: "nylon", color: "Sage", extraSpecifications: [pending("zipper_length"), textValue("zipper_structure", "隐形结构", "Invisible construction")] }, "review", ["dyeing", "assembly"], ["test-durability"]),
  revision(variants[5], { material: "recycled_nylon", color: "Clay", extraSpecifications: [pending("cord_diameter")] }, "draft", ["molding", "assembly"], ["test-tensile"]),
  revision(variants[6], { material: "recycled_polyester_blend", width: 20, color: "Sand", extraSpecifications: [pending("tape_weight"), numberValue("tape_width", 20, "mm")] }, "draft", ["weaving", "dyeing"], ["test-colorfastness"]),
  revision(variants[7], { material: "polyester", width: 25, extraSpecifications: [numberValue("label_width", 25, "mm")] }, "approved", ["weaving", "cutting"], []),
  revision(variants[8], { material: "aluminum", finish: "brushed", extraSpecifications: [] }, "approved", ["molding", "finishing"], []),
  revision(variants[9], { material: "nylon", size: "20 mm", extraSpecifications: [] }, "approved", ["molding", "assembly"], []),
  { id: "rev-var-snap-brass-v1", variantId: "var-snap-brass", revisionNumber: 1, configuration: { material: "zinc_alloy", size: "15 mm", color: "Antique brass", finish: "antique_brass", extraSpecifications: [numberValue("button_diameter", 15, "mm"), textValue("button_structure", "四合扣", "Snap button")] }, processIds: ["molding", "plating", "assembly"], testRequirementIds: [], assetIds: ["asset-prod-snap"], changeReason: L("初版仿古铜外观供内部评审。", "Initial antique-brass finish for internal review."), author: "Demo Design Team", status: "archived", createdAt: "2026-06-12" },
];
const processNames: Array<[string, string, string]> = [["weaving", "织造", "Weaving"], ["dyeing", "染色", "Dyeing"], ["coating", "覆膜", "Coating"], ["plating", "电镀", "Plating"], ["molding", "成型", "Molding"], ["assembly", "装配", "Assembly"], ["printing", "印刷", "Printing"], ["laser", "激光雕刻", "Laser Engraving"], ["testing", "测试", "Testing"], ["cutting", "裁切", "Cutting"], ["finishing", "表面整理", "Finishing"]];

export const mockProductLibrary: ProductLibraryData = {
  categories: [["zipper", "拉链", "Zipper"], ["button", "纽扣", "Button"], ["label", "标签", "Label"], ["tape", "织带", "Tape"], ["cord", "绳扣", "Cord"], ["puller", "拉片", "Puller"], ["buckle", "带扣", "Buckle"], ["accessory", "其他辅料", "Accessory"]].map(([id, zh, en], index) => ({ id, code: id, name: L(zh, en), sortOrder: index, status: "active" })),
  products, variants, revisions,
  specificationDefinitions: [
    { id: "zipper_structure", code: "zipper_structure", label: L("拉链结构", "Zipper Structure"), dataType: "text", categoryIds: ["zipper"] },
    { id: "zipper_length", code: "zipper_length", label: L("拉链长度", "Zipper Length"), dataType: "number", unitCode: "cm", categoryIds: ["zipper"] },
    { id: "button_diameter", code: "button_diameter", label: L("纽扣直径", "Button Diameter"), dataType: "number", unitCode: "mm", categoryIds: ["button"] },
    { id: "button_structure", code: "button_structure", label: L("纽扣结构", "Button Structure"), dataType: "text", categoryIds: ["button"] },
    { id: "button_holes", code: "button_holes", label: L("缝孔数量", "Sewing Holes"), dataType: "number", categoryIds: ["button"] },
    { id: "cord_diameter", code: "cord_diameter", label: L("绳扣孔径", "Cord Opening"), dataType: "number", unitCode: "mm", categoryIds: ["cord"] },
    { id: "tape_weight", code: "tape_weight", label: L("织带克重", "Tape Weight"), dataType: "number", unitCode: "g/m", categoryIds: ["tape"] },
    { id: "tape_width", code: "tape_width", label: L("织带宽度", "Tape Width"), dataType: "number", unitCode: "mm", categoryIds: ["tape"] },
    { id: "label_width", code: "label_width", label: L("标签宽度", "Label Width"), dataType: "number", unitCode: "mm", categoryIds: ["label"] },
  ],
  assets: [
    ...products.map((item) => ({ id: `asset-${item.id}`, productId: item.id, kind: "image" as const, fileRef: `/products/${item.categoryId}.svg`, assetVersion: "V1", description: L(`${item.name.zh} · 模拟产品示意图`, `${item.name.en} · synthetic product illustration`), uploadedBy: "Demo Design Team", createdAt: day, visibility: "customer_eligible" as const, reviewStatus: "approved" as const })),
    { id: "asset-waterproof-drawing", productId: "prod-waterproof", variantId: "var-waterproof-black", kind: "technical_drawing" as const, fileRef: "/products/document-placeholder.svg", assetVersion: "V1", description: L("防水拉链技术图占位资料", "Waterproof zipper drawing placeholder"), uploadedBy: "Demo Design Team", createdAt: day, visibility: "internal" as const, reviewStatus: "draft" as const },
    { id: "asset-waterproof-pdf", productId: "prod-waterproof", kind: "pdf" as const, fileRef: "/products/document-placeholder.svg", assetVersion: "V1", description: L("技术说明 PDF 占位资料", "Technical PDF placeholder"), uploadedBy: "Demo Design Team", createdAt: day, visibility: "internal" as const, reviewStatus: "draft" as const },
    { id: "asset-snap-cad", productId: "prod-snap", kind: "cad" as const, fileRef: "/products/document-placeholder.svg", assetVersion: "V1", description: L("四合扣 CAD 占位资料", "Snap CAD placeholder"), uploadedBy: "Demo Design Team", createdAt: day, visibility: "internal" as const, reviewStatus: "draft" as const },
  ],
  processes: processNames.map(([id, zh, en]) => ({ id, code: id, name: L(zh, en) })),
  productProcesses: revisions.flatMap((item) => item.processIds.map((processId, index) => ({ id: `pp-${item.id}-${processId}`, revisionId: item.id, processId, sequence: index + 1, customizable: processId === "dyeing", customerSummary: L("按确认规格执行", "Performed to the confirmed specification"), internalTechnicalNote: L("演示技术说明；工艺能力须逐项核实。", "Synthetic technical note; each process capability requires verification.") }))),
  factories: [
    { id: "factory-demo-a", code: "DEMO-F01", name: L("演示工厂 A", "Demo Factory A"), region: L("模拟华东地区", "Fictional East China region"), status: "active", internalNote: L("纯虚构工厂，不代表实际供应商。", "Fictional factory; not a real supplier.") },
    { id: "factory-demo-b", code: "DEMO-F02", name: L("演示工厂 B", "Demo Factory B"), region: L("模拟华南地区", "Fictional South China region"), status: "active", internalNote: L("能力仅为演示，尚未真实核验。", "Capabilities are synthetic and unverified in reality.") },
    { id: "factory-demo-c", code: "DEMO-F03", name: L("演示工厂 C", "Demo Factory C"), region: L("模拟华东地区", "Fictional East China region"), status: "active", internalNote: L("纯虚构工厂。", "Fictional factory.") },
  ],
  factoryCapabilities: [
    { id: "cap-a-zip", factoryId: "factory-demo-a", productId: "prod-waterproof", materialCodes: ["nylon_tpu"], processIds: ["dyeing", "coating", "assembly"], dimensionalRanges: [{ min: 3, max: 8, unit: "zipper_size" }], moqRange: { min: 3000, max: 100000, unit: "pcs" }, sampleLeadDays: { min: 7, max: 14, unit: "days" }, productionLeadDays: { min: 25, max: 40, unit: "days" }, status: "supported", limitations: L("专项洗后测试需外部协作。", "Post-wash testing requires an external partner.") },
    { id: "cap-b-snap", factoryId: "factory-demo-b", productId: "prod-snap", materialCodes: ["zinc_alloy"], processIds: ["molding", "plating", "assembly"], dimensionalRanges: [{ min: 12, max: 25, unit: "mm" }], moqRange: { min: 5000, max: 80000, unit: "pcs" }, sampleLeadDays: { min: 10, max: 18, unit: "days" }, productionLeadDays: { min: 30, max: 45, unit: "days" }, status: "supported", limitations: L("特定表面色需单独确认。", "Specific finishes require separate confirmation.") },
    { id: "cap-c-invisible", factoryId: "factory-demo-c", productId: "prod-invisible", materialCodes: ["nylon"], processIds: ["dyeing", "assembly"], dimensionalRanges: [], status: "unverified", limitations: L("颜色和长度范围尚未核实。", "Color and length range not verified.") },
    { id: "cap-a-tape", factoryId: "factory-demo-a", productId: "prod-tape", materialCodes: ["recycled_polyester_blend"], processIds: ["weaving", "dyeing"], dimensionalRanges: [{ min: 15, max: 35, unit: "mm" }], status: "unverified", limitations: L("克重规格未确认。", "Weight specification is pending.") },
    { id: "cap-b-cord", factoryId: "factory-demo-b", productId: "prod-cord", materialCodes: ["recycled_nylon"], processIds: ["molding"], dimensionalRanges: [], status: "unverified", limitations: L("孔径与材料来源需核实。", "Opening size and material source require verification.") },
  ],
  tests: [["water", "洗后防泼水", "Post-Wash Water Resistance"], ["nickel", "镍释放", "Nickel Release"], ["durability", "拉合耐久", "Closure Durability"], ["tensile", "拉力", "Tensile Strength"], ["colorfastness", "色牢度", "Color Fastness"], ["salt", "盐雾", "Salt Spray"]].map(([id, zh, en]) => ({ id, code: id, name: L(zh, en) })),
  testRequirements: [
    { id: "test-water", revisionId: "rev-var-waterproof-black", testId: "water", threshold: L("项目需求：5 次水洗后评分不低于 80；产品库测试定义待独立核实。", "Project requirement: score ≥ 80 after five washes; independent library validation pending."), status: "pending", source: L("案例 A 项目要求", "Case A project requirement") },
    { id: "test-nickel", revisionId: "rev-var-snap-brass", testId: "nickel", threshold: L("按客户最终确认的方法与限值", "Per the customer's final confirmed method and threshold"), status: "pending", source: L("案例 B 项目要求", "Case B project requirement") },
    { id: "test-durability", revisionId: "rev-var-invisible-sand", testId: "durability", threshold: L("尚未确认", "Not confirmed"), status: "pending", source: L("演示开发方向", "Synthetic development direction") },
    { id: "test-tensile", revisionId: "rev-var-cord-recycled", testId: "tensile", threshold: L("尚未确认", "Not confirmed"), status: "pending", source: L("演示开发方向", "Synthetic development direction") },
    { id: "test-colorfastness", revisionId: "rev-var-tape-soft", testId: "colorfastness", threshold: L("尚未确认", "Not confirmed"), status: "pending", source: L("演示开发方向", "Synthetic development direction") },
  ],
  factoryTestCapabilities: [
    { id: "ft-a-water", factoryId: "factory-demo-a", testId: "water", mode: "external_partner", status: "unverified" },
    { id: "ft-b-nickel", factoryId: "factory-demo-b", testId: "nickel", mode: "external_partner", status: "unverified" },
  ],
  certifications: [{ id: "cert-demo-material", name: L("模拟材料来源声明", "Synthetic Material Source Statement"), issuer: L("演示资料", "Demo Record"), status: "unverified" }],
  certificationScopes: [{ id: "scope-demo-material", certificationId: "cert-demo-material", targetType: "material", targetId: "recycled_nylon", note: L("仅指材料来源，非成品认证。", "Material source only; not a finished-product certification.") }],
  salesProfiles: products.map((item) => ({ id: `sales-${item.id}`, productId: item.id, sellingPoints: item.tagCodes.map((code) => ({ featureCode: code, explanation: ({ water_resistant: L("适合探索防泼水应用，性能以测试为准。", "Suitable for exploring water-resistant applications; performance requires testing."), custom_logo: L("可讨论标识定制方式。", "Logo customization can be discussed."), premium_finish: L("外观质感方向可选择。", "Finish direction can be tailored."), lightweight: L("适合轻量化开发方向。", "Suitable for lightweight development."), recycled_material: L("可探索再生材料方案，来源需验证。", "Recycled material options are possible, subject to source verification.") } as Record<string, LocalizedText>)[code] ?? L("演示卖点", "Synthetic selling point"), evidenceStatus: "unverified" as const })), applications: [item.description], customerFit: L("根据项目规格确认适用性。", "Confirm suitability against project specifications."), marketFeedback: L("尚无可复用的正式市场反馈。", "No formal reusable market feedback yet."), internalSalesNote: L("演示销售资料，不构成客户承诺。", "Synthetic sales guidance; not a customer commitment.") })),
  commercialProfiles: [
    { id: "cp-waterproof", productId: "prod-waterproof", moqGuidance: 3000, sampleLeadDays: { min: 7, max: 14, unit: "days" }, productionLeadDays: { min: 25, max: 40, unit: "days" }, currency: "USD", referencePrice: 0.95, referenceTiers: [{ minQuantity: 3000, unitPrice: 0.95, unit: "pcs" }], validUntil: "2026-12-31", source: L("虚构演示销售指导", "Synthetic demo sales guidance"), updatedAt: day, internalCommercialNote: L("非正式报价；具体交易条件需另行确认。", "Not a quotation; transaction terms require confirmation.") },
    { id: "cp-waterproof-black", productId: "prod-waterproof", variantId: "var-waterproof-black", moqGuidance: 5000, sampleLeadDays: { min: 8, max: 14, unit: "days" }, productionLeadDays: { min: 28, max: 42, unit: "days" }, currency: "USD", referencePrice: 0.99, referenceTiers: [{ minQuantity: 5000, unitPrice: 0.99, unit: "pcs" }], validUntil: "2026-12-31", source: L("黑色变体演示指导", "Synthetic black-variant guidance"), updatedAt: day, internalCommercialNote: L("变体指导覆盖家族默认值。", "Variant guidance overrides product default.") },
    ...products.filter((item) => item.id !== "prod-waterproof").map((item) => ({ id: `cp-${item.id}`, productId: item.id, moqGuidance: undefined, sampleLeadDays: undefined, productionLeadDays: undefined, currency: "USD" as const, referencePrice: undefined, referenceTiers: [], source: L("待销售核实", "Pending sales verification"), updatedAt: day, internalCommercialNote: L("价格和数量尚未确认。", "Price and quantity are not confirmed.") })),
  ],
  publications: [
    { id: "pub-waterproof", productId: "prod-waterproof", variantId: "var-waterproof-black", revisionId: "rev-var-waterproof-black", status: "published", name: { ...products[0].name }, description: { ...products[0].description }, publishedProductCode: products[0].productCode, publishedVariantCode: variants[0].variantCode, publishedConfiguration: structuredClone(revisions[0].configuration), sellingPoints: [L("外观为低轮廓哑光方向。", "Low-profile matte appearance.")], applications: [L("户外服装", "Outdoor apparel")], assetIds: ["asset-prod-waterproof"], publishedAssets: [{ assetId: "asset-prod-waterproof", fileRef: "/products/zipper.svg" }], options: { showProductCode: true, showMoq: false, showLeadTime: false, showReferencePrice: false, showProcess: false }, publishedAt: day },
    { id: "pub-snap", productId: "prod-snap", variantId: "var-snap-brass", revisionId: "rev-var-snap-brass", status: "published", name: { ...products[1].name }, description: { ...products[1].description }, publishedProductCode: products[1].productCode, publishedVariantCode: variants[2].variantCode, publishedConfiguration: structuredClone(revisions[2].configuration), sellingPoints: [L("复古金属外观。", "Antique metal appearance.")], applications: [L("时装外套", "Fashion outerwear")], assetIds: ["asset-prod-snap"], publishedAssets: [{ assetId: "asset-prod-snap", fileRef: "/products/button.svg" }], options: { showProductCode: true, showMoq: false, showLeadTime: false, showReferencePrice: false, showProcess: false }, publishedAt: day },
  ],
  projectProducts: [
    { id: "pproj-nas", projectId: 1, productId: "prod-waterproof", source: "legacy_sample", applicationNote: L("户外服装防水闭合开发；长度和颜色组合未逐项锁定。", "Outdoor closure development; length and color combinations are not fully allocated."), proposalStatus: "sampling", createdAt: "2026-07-12" },
    { id: "pproj-efc", projectId: 2, productId: "prod-snap", variantId: "var-snap-brass", source: "legacy_sample", applicationNote: L("复古金属细节。", "Antique metal detail."), proposalStatus: "selected", createdAt: "2026-07-15" },
    { id: "pproj-eyw-zip", projectId: 3, productId: "prod-invisible", source: "legacy_sample", applicationNote: L("Sand 和 Sage 调色开发。", "Sand and Sage color development."), proposalStatus: "sampling", createdAt: "2026-07-23" },
    { id: "pproj-eyw-cord", projectId: 3, productId: "prod-cord", source: "legacy_sample", applicationNote: L("结构和颜色待确认。", "Construction and color pending."), proposalStatus: "sampling", createdAt: "2026-07-24" },
    { id: "pproj-eyw-tape", projectId: 3, productId: "prod-tape", source: "legacy_sample", applicationNote: L("克重和材料待确认。", "Weight and material pending."), proposalStatus: "sampling", createdAt: "2026-07-25" },
  ],
};
