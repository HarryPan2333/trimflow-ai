import type { BusinessCase, Sample, SampleFeedback, SampleSpecification, SampleVersion } from "./types";

const confirmed = (value: string): SampleSpecification => ({ value, status: "Confirmed" });
const pending = (value = ""): SampleSpecification => ({ value, status: "Pending" });
const notRequired = (value: string): SampleSpecification => ({ value, status: "Not Required" });

// Enrichment only: the original cases remain the sole source of sample IDs and relationships.
// All costs, logistics identifiers and design references below are fictional demo metadata.
const sampleMetadata: Record<string, Partial<Sample>> = {
  "SP-NAS-2407": {
    sampleType: "Sales Sample", owner: "陈晨", targetDate: "2026-07-31",
    logistics: { versionId: "SP-NAS-2407-V3", courier: "Demo Express", trackingNumber: "DEMO-NAS-V3-0730", expectedArrival: "2026-07-31", receivedDate: "2026-07-31", destination: "Seattle · US", receiver: "Olivia Reed" },
    developmentCost: { currency: "USD", sampleFee: 90, mouldFee: 45, courierFee: 32, testingFee: 120, other: 0 },
    designIn: { customerIdea: "低轮廓防水闭合结构 / Low-profile waterproof closure", application: "Performance Outerwear", reference: "匿名客户参考样 · REF-NAS-01（演示）", suggestedProduct: "轻量哑光防水拉链", suggestedMaterial: "尼龙链牙 + TPU 膜", suggestedProcess: "哑光覆膜 + 拉片激光雕刻", notes: "以洗后功能稳定性为基础，平衡轻量化与表面效果。", potential: "可探索拉片与反光辅料的同系列开发；尚非客户已确认需求。" },
  },
  "SP-EFC-2411": {
    sampleType: "Bulk Approval Sample", owner: "王璐", targetDate: "2026-07-18",
    logistics: { versionId: "SP-EFC-2411-V2", courier: "Demo Express", trackingNumber: "DEMO-EFC-V2-0716", expectedArrival: "2026-07-18", receivedDate: "2026-07-18", destination: "Paris · FR", receiver: "Camille Bernard" },
    developmentCost: { currency: "EUR", sampleFee: 65, mouldFee: 110, courierFee: 28, testingFee: 95, other: 0 },
    designIn: { customerIdea: "低调的复古金属细节", application: "Fashion Jackets", reference: "匿名 Logo 与古铜色参考板 · REF-EFC-01（演示）", suggestedProduct: "15 mm 锌合金四合扣", suggestedMaterial: "Zinc alloy", suggestedProcess: "无镍电镀 + Logo 压印", notes: "让 Logo 深度与表面色调保持一致，确认样用于大货标准。", potential: "可探索其他尺寸和后续季度复购。" },
  },
  "SP-EYW-2502-ZIP": {
    sampleType: "Development Sample", owner: "林薇", targetDate: "2026-08-03",
    logistics: { versionId: "SP-EYW-2502-ZIP-V1", courier: "Demo Express", trackingNumber: "DEMO-EYW-ZIP-V1", expectedArrival: "2026-07-29", receivedDate: "2026-07-29", destination: "Melbourne · AU", receiver: "Mia Collins" },
    developmentCost: { currency: "USD", sampleFee: 48, mouldFee: 0, courierFee: 24, other: 0 },
  },
  "SP-EYW-2502-LOCK": {
    sampleType: "Initial Sample", owner: "林薇", targetDate: "2026-08-04",
    logistics: { versionId: "SP-EYW-2502-LOCK-V1", courier: "Demo Express", trackingNumber: "DEMO-EYW-LOCK-V1", expectedArrival: "2026-07-30", receivedDate: "2026-07-30", destination: "Melbourne · AU", receiver: "Mia Collins" },
    developmentCost: { currency: "USD", sampleFee: 35, mouldFee: 0, courierFee: 24, other: 0 },
  },
  "SP-EYW-2502-WEB": {
    sampleType: "Development Sample", owner: "林薇", targetDate: "2026-08-07",
    developmentCost: { currency: "USD", sampleFee: 0, mouldFee: 0, courierFee: 0, other: 0 },
  },
};

const yogaDesign: NonNullable<Sample["designIn"]> = {
  customerIdea: "柔软、低轮廓的辅料系统 / Soft-touch, low-profile trim system",
  application: "Yoga / Athleisure Collection", reference: "2027 系列匿名概念板 · REF-EYW-01（演示）",
  suggestedProduct: "隐形拉链 + 再生绳扣 + 弹力织带", suggestedMaterial: "再生尼龙与再生涤纶混纺方向",
  suggestedProcess: "分产品调色、结构验证与触感评审", notes: "按优先级分批确认色号、Logo 和克重，减少无效打样。",
  potential: "Multi-Product · 同系列颜色与季度开发机会，尚待客户确认。",
};

const nasBase = { category: confirmed("Waterproof zipper"), material: confirmed("Nylon + TPU"), size: confirmed("#5 · 58 / 64 / 72 cm"), color: confirmed("Black / Cool Gray"), pantone: confirmed("Black C / Cool Gray 11 C"), sampleQuantity: confirmed("12 条 / pcs"), moq: confirmed("80,000 条 / pcs"), functional: confirmed("防水闭合 / Water-repellent closure") };
const nasV1 = { ...nasBase, color: pending("Cool Gray 偏冷"), finish: pending("偏亮膜面 / Glossy"), logo: pending("标准拉片，无 Logo"), logoMethod: pending(), logoPosition: pending(), testing: pending("水洗次数待确认") };
const nasV2 = { ...nasV1, color: confirmed("Black / 调暖 Cool Gray"), finish: confirmed("哑光 / Matte"), logo: pending("客户代号位置样"), logoMethod: confirmed("Laser engraving"), logoPosition: pending("待调整 / Adjustment requested"), testing: pending("需补充 5 次水洗测试") };
const nasV3 = { ...nasV2, logo: confirmed("匿名客户代号"), logoPosition: confirmed("上移 2 mm / Shifted up 2 mm"), testing: confirmed("AATCC 22 · 5 次水洗后 ≥ 80") };
const efcBase = { category: confirmed("Snap button"), material: confirmed("Zinc alloy"), size: confirmed("15 mm"), color: confirmed("Antique brass"), finish: confirmed("Nickel-free plating"), logo: confirmed("匿名品牌字母 / Anonymous initials"), logoMethod: confirmed("Debossing"), functional: confirmed("四合扣结构 / Snap closure"), sampleQuantity: confirmed("20 套 / sets"), moq: confirmed("50,000 套 / sets"), testing: confirmed("REACH SVHC + Nickel Release") };
const yogaZip = { category: confirmed("Invisible zipper"), material: pending(), size: confirmed("#3 · 20 / 25 cm"), color: pending("Sand 偏黄 / Sage 偏灰"), pantone: pending(), logo: notRequired("当前功能样无需 Logo；大货要求另行确认"), logoMethod: notRequired("当前功能样不适用"), functional: confirmed("Auto-lock slider"), sampleQuantity: confirmed("8 条 / pcs"), moq: pending(), testing: pending() };

const versionMetadata: Record<string, Partial<SampleVersion>> = {
  "SP-NAS-2407-V1": { specifications: nasV1, reasonForChange: "验证客户参考样的颜色与表面方向。", internalNote: "首版仅用于外观讨论，测试标准尚未冻结。" },
  "SP-NAS-2407-V2": { specifications: nasV2, reasonForChange: "V1 反馈灰色偏冷、膜面偏亮。", revisionFeedbackIds: ["fb-nas-v1-01"], internalNote: "颜色与光泽已接受，需继续验证 Logo 与洗后性能。" },
  "SP-NAS-2407-V3": { specifications: nasV3, reasonForChange: "V2 要求调整 Logo 并补充洗后测试。", revisionFeedbackIds: ["fb-nas-v2-01"], internalNote: "按确认样整理规格和测试结果。", reviewOutcome: "Approved" },
  "SP-EFC-2411-V1": { specifications: { ...efcBase, color: pending("古铜色偏红"), logoDepth: pending("初版深度不足") }, reasonForChange: "验证古铜色与 Logo 压印方向。" },
  "SP-EFC-2411-V2": { specifications: { ...efcBase, color: confirmed("古铜色，降低红调"), logoDepth: confirmed("较 V1 加深 0.2 mm") }, reasonForChange: "客户要求 Logo 加深、古铜色降低红调。", revisionFeedbackIds: ["fb-efc-v1-01"], internalNote: "客户确认样，作为大货验收参考。", reviewOutcome: "Approved" },
  "SP-EYW-2502-ZIP-V1": { specifications: yogaZip, reasonForChange: "将概念板转成可评审的实物颜色样。" },
  "SP-EYW-2502-ZIP-V2": { specifications: { ...yogaZip, color: pending("Sand 降低黄调 / Sage 降低灰度") }, reasonForChange: "按 V1 反馈调整两组颜色。", revisionFeedbackIds: ["fb-eyw-zip-v1"], internalNote: "修改正在进行，仍需客户确认色号与调整结果。" },
  "SP-EYW-2502-LOCK-V1": { specifications: { category: confirmed("Cord lock"), material: confirmed("Recycled nylon"), size: pending(), color: pending("Clay"), pantone: pending(), finish: pending(), logo: pending(), logoMethod: pending(), functional: confirmed("单孔结构 / Single-hole"), testing: pending(), sampleQuantity: confirmed("10 个 / pcs"), moq: pending() }, reasonForChange: "先评审单孔结构，再确认颜色和 Logo 工艺。" },
  "SP-EYW-2502-WEB-V1": { specifications: { category: confirmed("Elastic tape"), material: pending("Recycled polyester blend"), size: confirmed("20 mm width"), color: pending("Sand"), weight: pending(), testing: pending(), sampleQuantity: pending(), moq: pending(), logo: pending() }, reasonForChange: "验证柔软触感和弹性，等待克重后排样。", internalNote: "不要在克重未确认时安排正式制作。" },
};

const feedbackMetadata: Record<string, Partial<SampleFeedback>> = {
  "fb-nas-v1-01": { category: "Color", severity: "Important", requiredAction: "调暖灰色色相并降低膜面光泽。", resolution: "Resolved", resolvedInVersionId: "SP-NAS-2407-V2" },
  "fb-nas-v2-01": { category: "Testing", severity: "Blocking", requiredAction: "补充 5 次水洗测试，Logo 位置上移 2 mm。", resolution: "Resolved", resolvedInVersionId: "SP-NAS-2407-V3" },
  "fb-nas-v3-01": { category: "Quality", severity: "Minor", requiredAction: "归档确认样。", resolution: "Resolved" },
  "fb-efc-v1-01": { category: "Logo", severity: "Important", requiredAction: "加深 Logo 压印并降低古铜色红调。", resolution: "Resolved", resolvedInVersionId: "SP-EFC-2411-V2" },
  "fb-efc-v2-01": { category: "Quality", severity: "Minor", requiredAction: "作为大货签样标准归档。", resolution: "Resolved" },
  "fb-eyw-zip-v1": { category: "Color", severity: "Important", requiredAction: "Sand 降低黄调、Sage 降低灰度，取得客户对 V2 的确认。", resolution: "Open" },
};

export function withSampleDevelopment(cases: BusinessCase[]): BusinessCase[] {
  return cases.map((item) => ({
    ...item,
    samples: item.samples.map((sample) => ({ ...sample, ...sampleMetadata[sample.id], ...(sample.projectId === 3 ? { designIn: yogaDesign } : {}) })),
    sampleVersions: item.sampleVersions.map((version) => ({ ...version, ...versionMetadata[version.id] })),
    sampleFeedback: item.sampleFeedback.map((feedback) => ({ ...feedback, ...feedbackMetadata[feedback.id] })),
  }));
}
