import type { BusinessCase, Contract, Delivery, PurchaseOrder, Shipment } from "./types";

const orderMetadata: Record<string, Partial<PurchaseOrder>> = {
  "po-efc-2411": {
    paymentTerm: "T/T 30% deposit, 70% before shipment",
    incoterm: "FOB Ningbo",
    shipTo: "Paris, France · Demo Destination",
    expectedPaymentDate: "2026-11-18",
    paidAmount: 8160,
    production: {
      factory: "Demo Production Unit EFC-01",
      targetCompletion: "2026-11-05",
      progress: 0,
      quantity: 80000,
      completedQuantity: 0,
      status: "Not Started",
    },
    productionMilestones: [
      { id: "pm-efc-material", label: "Material Ready", targetDate: "2026-08-14", owner: "Production Planning", status: "Current", dependency: "Contract Confirmed" },
      { id: "pm-efc-start", label: "Production Start", targetDate: "2026-08-18", owner: "Demo Production Unit", status: "Pending", dependency: "Material Ready" },
      { id: "pm-efc-mid", label: "Mid-production Check", targetDate: "2026-09-15", owner: "Quality Team", status: "Pending", dependency: "Production Start" },
      { id: "pm-efc-bulk", label: "Bulk Completion", targetDate: "2026-11-05", owner: "Demo Production Unit", status: "Pending", dependency: "Quality Approval" },
      { id: "pm-efc-pack", label: "Packing Complete", targetDate: "2026-11-12", owner: "Order Operations", status: "Pending", dependency: "Bulk Completion + Shipping Mark" },
    ],
    approvals: [
      { id: "ap-efc-bulk", type: "Bulk Sample Approval", requirement: "Match approved SP-EFC-2411 V2", status: "Pending", owner: "Product Development", note: "大货首件完成后送审。", blocking: true },
      { id: "ap-efc-color", type: "Color Approval", requirement: "Antique brass approved standard", status: "Approved", date: "2026-07-18", owner: "Camille Bernard · Demo Client", note: "沿用确认样表面标准。", blocking: true },
      { id: "ap-efc-quality", type: "Quality Approval", requirement: "AQL inspection before packing", status: "Pending", owner: "Quality Team", note: "大货完成后执行。", blocking: true },
      { id: "ap-efc-test", type: "Testing Approval", requirement: "REACH SVHC + Nickel Release", status: "Pending", owner: "Testing Team", note: "测试费用已包含在 Accepted Quote。", blocking: true },
    ],
    documents: [
      { id: "doc-efc-contract", name: "Contract", status: "Available" },
      { id: "doc-efc-ci", name: "Commercial Invoice", status: "Pending" },
      { id: "doc-efc-pl", name: "Packing List", status: "Pending" },
      { id: "doc-efc-test", name: "Test Report", status: "Pending" },
    ],
    issues: [
      { id: "issue-efc-mark", type: "Customer Dependency", severity: "Low", issue: "最终外箱唛头尚未确认。", impact: "不影响当前材料准备；包装前必须关闭。", owner: "王璐", action: "在 2026-08-15 前取得客户唛头文件。", blocking: false, resolved: false },
    ],
    executionTimeline: [
      { id: "oe-efc-po", category: "Commercial", date: "2026-08-02", title: "PO Received", detail: "收到正式 PO-EFC-240802。" },
      { id: "oe-efc-contract", category: "Commercial", date: "2026-08-05", title: "Contract Confirmed", detail: "合同商务条款已确认，进入生产准备。" },
      { id: "oe-efc-plan", category: "Production", date: "2026-08-05", title: "Production Plan Created", detail: "建立材料、生产、检验与包装节点。" },
      { id: "oe-efc-delivery", category: "Logistics", date: "2026-08-05", title: "Delivery Plan Created", detail: "计划 2026-11-15 交付。" },
    ],
  },
};

const contractMetadata: Record<string, Partial<Contract>> = {
  "ct-efc-240805": {
    createdDate: "2026-08-03",
    paymentTerm: "T/T 30% deposit, 70% before shipment",
    incoterm: "FOB Ningbo",
    contractValue: 27200,
  },
};

const deliveryMetadata: Record<string, Partial<Delivery>> = {
  "dl-efc-241115": { destination: "Paris, France · Demo Destination", method: "Air Freight", status: "Planned" },
};

const shipmentMetadata: Record<string, Partial<Shipment>> = {
  "sh-efc-241118": { carrier: "Demo Air Cargo", reference: "DEMO-EFC-AIR-1118" },
};

// Step 7 only enriches the existing synthetic Case B execution story.
export function withOrderExecution(cases: BusinessCase[]): BusinessCase[] {
  return cases.map((item) => ({
    ...item,
    purchaseOrders: item.purchaseOrders.map((order) => ({ ...order, ...orderMetadata[order.id] })),
    contracts: item.contracts.map((contract) => ({ ...contract, ...contractMetadata[contract.id] })),
    deliveries: item.deliveries.map((delivery) => ({ ...delivery, ...deliveryMetadata[delivery.id] })),
    shipments: item.shipments.map((shipment) => ({ ...shipment, ...shipmentMetadata[shipment.id] })),
  }));
}
