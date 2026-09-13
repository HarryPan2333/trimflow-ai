import type { BusinessCase, NegotiationRecord, Quotation, QuotationTier } from "./types";

const quoteMetadata: Record<string, Partial<Quotation>> = {
  "QT-NAS-2407-V1": {
    approvedSampleId: "SP-NAS-2407",
    createdAt: "2026-07-28",
    owner: "陈晨",
    leadTime: "30 days",
    paymentTerm: "T/T 30% deposit, 70% before shipment",
    customerTargetMoq: 80000,
    customerTargetLeadTime: "21 days",
    customerPaymentTerm: "T/T 30% deposit, 70% before shipment",
    customerTestingRequirement: "AATCC 22 · 5 washes · rating ≥ 80",
    customerMaterialFinish: "Nylon + TPU · matte finish",
    testingRequirement: "AATCC 22 · 5 washes · rating ≥ 80",
    materialFinish: "Nylon + TPU · matte finish",
    reasonForRevision: "客户提出年度数量与目标价，需要将数量承诺和专项测试费用拆分讨论。",
    commercialPosition: "Strong",
    lastActivityAt: "2026-07-31",
    nextAction: "形成 V2 数量阶梯并明确测试费条件",
    additionalFee: 120,
  },
  "QT-NAS-2407-V2": {
    approvedSampleId: "SP-NAS-2407",
    createdAt: "2026-08-01",
    owner: "陈晨",
    leadTime: "28 days",
    paymentTerm: "T/T 30% deposit, 70% before shipment",
    customerTargetMoq: 80000,
    customerTargetLeadTime: "21 days",
    customerPaymentTerm: "T/T 30% deposit, 70% before shipment",
    customerTestingRequirement: "AATCC 22 · 5 washes · rating ≥ 80",
    customerMaterialFinish: "Nylon + TPU · matte finish",
    testingRequirement: "AATCC 22 · 5 washes · rating ≥ 80",
    materialFinish: "Nylon + TPU · matte finish",
    reasonForRevision: "以 120K / 200K 数量承诺、标准包装与测试费用单列回应客户反馈。",
    commercialPosition: "Balanced",
    lastActivityAt: "2026-08-02",
    nextAction: "确认客户对 120K / 200K 方案、测试费用及采购节奏的反馈",
    additionalFee: 120,
  },
  "QT-EFC-2411-V1": {
    approvedSampleId: "SP-EFC-2411",
    createdAt: "2026-07-21",
    owner: "王璐",
    leadTime: "35 days",
    paymentTerm: "T/T 30% deposit, 70% before shipment",
    customerTargetMoq: 50000,
    customerTargetLeadTime: "35 days",
    customerPaymentTerm: "T/T 30% deposit, 70% before shipment",
    customerTestingRequirement: "REACH SVHC + Nickel Release included",
    customerMaterialFinish: "Zinc alloy · antique brass · nickel free",
    testingRequirement: "REACH SVHC + Nickel Release included",
    materialFinish: "Zinc alloy · antique brass · nickel free",
    reasonForRevision: "首版正式报价；客户已接受 80,000 套档位。",
    commercialPosition: "Balanced",
    lastActivityAt: "2026-07-24",
    nextAction: "创建或核对 Purchase Order",
    additionalFee: 0,
  },
};

const tierMetadata: Record<string, Partial<QuotationTier>> = {
  "tier-nas-v1-80": { leadTime: "30 days", moq: 80000, commercialPosition: "Strong" },
  "tier-nas-v1-120": { leadTime: "30 days", moq: 80000, commercialPosition: "Balanced", recommended: true },
  "tier-nas-v1-200": { leadTime: "35 days", moq: 80000, commercialPosition: "Aggressive" },
  "tier-nas-v2-80": { leadTime: "28 days", moq: 80000, commercialPosition: "Strong" },
  "tier-nas-v2-120": { leadTime: "28 days", moq: 80000, commercialPosition: "Balanced", recommended: true },
  "tier-nas-v2-200": { leadTime: "35 days", moq: 80000, commercialPosition: "Aggressive" },
  "tier-efc-50": { leadTime: "35 days", moq: 50000, commercialPosition: "Strong" },
  "tier-efc-80": { leadTime: "35 days", moq: 50000, commercialPosition: "Balanced", recommended: true },
  "tier-efc-150": { leadTime: "42 days", moq: 50000, commercialPosition: "Aggressive" },
};

const recordMetadata: Record<string, Partial<NegotiationRecord>> = {
  "neg-nas-01": {
    actor: "Olivia Reed · Client",
    type: "Target Received",
    ourPosition: "V1 · USD 0.91 / 120K",
    customerPosition: "Target USD 0.82 · annual volume up to 200K",
    note: "客户希望依据年度采购规模重新评估。",
    nextMove: "核实年度预测并准备数量阶梯",
  },
  "neg-nas-02": {
    actor: "陈晨 · Internal Review",
    type: "Internal Review",
    ourPosition: "标准包装、年度承诺与专项测试费可作为交换条件",
    customerPosition: "等待新的数量方案",
    note: "不直接承诺新的未记录价格。",
    nextMove: "形成 V2 报价",
  },
  "neg-nas-03": {
    actor: "陈晨 · Sales",
    type: "Quote Sent",
    ourPosition: "V2 · USD 0.88 / 120K；USD 0.85 / 200K",
    customerPosition: "等待确认数量承诺与测试费用",
    note: "V2 已发送，材料与测试规格保持不变。",
    nextMove: "跟进客户对数量承诺和测试费用的回复",
  },
  "neg-efc-01": {
    actor: "Camille Bernard · Client",
    type: "Commercial Confirmation",
    ourPosition: "EUR 0.34 / 80K · testing included",
    customerPosition: "Accepted",
    note: "客户接受报价，要求合同列明测试费用已包含。",
    nextMove: "核对正式 PO 与合同条款",
  },
};

const additionalRecords: Record<number, NegotiationRecord[]> = {
  1: [
    {
      id: "neg-nas-00",
      quotationId: "QT-NAS-2407-V1",
      projectId: 1,
      recordedAt: "2026-07-29",
      direction: "销售回复",
      summary: "Quotation V1 已发送。",
      nextAction: "等待客户商务反馈",
      actor: "陈晨 · Sales",
      type: "Quote Sent",
      ourPosition: "V1 · USD 0.91 / 120K · MOQ 80K",
      customerPosition: "尚未反馈",
      note: "首版三档数量报价已发送。",
      nextMove: "确认客户目标与数量计划",
    },
    {
      id: "neg-nas-04",
      quotationId: "QT-NAS-2407-V2",
      projectId: 1,
      recordedAt: "2026-08-01",
      direction: "内部建议",
      summary: "完成 V2 商务条件复核。",
      nextAction: "发送 V2",
      actor: "报价组 · Internal",
      type: "Revision",
      ourPosition: "保留材料与测试；调整数量阶梯、包装及交期条件",
      customerPosition: "Target USD 0.82",
      note: "V2 以条件交换缩小差距，不改变已确认技术要求。",
      nextMove: "发送修订报价",
    },
  ],
  2: [],
  3: [],
};

function lineItems(quote: Quotation): Quotation["lineItems"] {
  return [{
    id: `${quote.id}-LINE-01`,
    quotationId: quote.id,
    product: quote.product,
    specification: quote.materialFinish ?? "按已确认样品及项目需求 / As approved sample",
    quantity: quote.quantity,
    unit: quote.unit,
    unitPrice: quote.unitPrice,
    amount: Number((quote.quantity * quote.unitPrice).toFixed(2)),
    currency: quote.currency,
  }];
}

// Step 6 enrichment only. The three original business stories remain authoritative.
export function withQuotationDevelopment(cases: BusinessCase[]): BusinessCase[] {
  return cases.map((item) => {
    const quotations = item.quotations.map((original) => {
      const quote = { ...original, ...quoteMetadata[original.id] };
      return { ...quote, lineItems: lineItems(quote) };
    });
    const existingIds = new Set(item.negotiationRecords.map((record) => record.id));
    const additions = (additionalRecords[item.project.id] ?? []).filter((record) => !existingIds.has(record.id));
    return {
      ...item,
      quotations,
      quotationTiers: item.quotationTiers.map((tier) => ({ ...tier, ...tierMetadata[tier.id] })),
      negotiationRecords: [...item.negotiationRecords.map((record) => ({ ...record, ...recordMetadata[record.id] })), ...additions]
        .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    };
  });
}
