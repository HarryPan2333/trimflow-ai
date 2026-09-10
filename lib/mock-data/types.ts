export type ProjectStage =
  | "新询盘"
  | "需求确认"
  | "打样中"
  | "报价中"
  | "谈判中"
  | "已确认订单"
  | "暂停或流失";

export type LifecycleStage =
  | "inquiry"
  | "requirement"
  | "sample"
  | "quotation"
  | "negotiation"
  | "po"
  | "delivery"
  | "shipment";

export type HealthStatus = "良好" | "关注" | "风险";
export type RequirementStatus = "已确认" | "待确认" | "有冲突" | "未提供";
export type SampleStatus =
  | "待制作"
  | "制作中"
  | "已完成"
  | "已寄出"
  | "客户评估中"
  | "需修改"
  | "已确认"
  | "已关闭";
export type QuotationStatus = "Draft" | "Sent" | "Negotiating" | "Accepted" | "Rejected" | "Expired";
export type OrderStage = "PO Received" | "Contract" | "Production" | "Delivery" | "Shipment" | "Completed";
export type TimelineEventType =
  | "inquiry"
  | "requirement"
  | "communication"
  | "sample"
  | "quotation"
  | "negotiation"
  | "po"
  | "contract"
  | "delivery"
  | "shipment"
  | "task";

export type Contact = {
  id: string;
  clientId: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
  department?:
    | "Sourcing"
    | "Material Development"
    | "Trim Development"
    | "Design"
    | "Production"
    | "Sustainability"
    | "Management";
  decisionRole?:
    | "Decision Maker"
    | "Influencer"
    | "Technical Approver"
    | "Buyer"
    | "User"
    | "Gatekeeper";
  influenceLevel?: "High" | "Medium" | "Low";
  relationshipStrength?: "Strong" | "Developing" | "Weak" | "Unknown";
  lastContactAt?: string;
};

export type Client = {
  id: string;
  code: string;
  name: string;
  country: string;
  region: string;
  type: string;
  status: "活跃" | "培育中" | "暂停";
  currency: "USD" | "EUR" | "CNY";
  paymentTerm: string;
  communicationLanguage: string;
  primaryContactId: string;
  lastContactAt: string;
  preferences: string[];
};

export type Project = {
  id: number;
  clientId: string;
  code: string;
  name: string;
  customer: string;
  region: string;
  product: string;
  stage: ProjectStage;
  lifecycleStage: LifecycleStage;
  progress: string;
  owner: string;
  next: string;
  updated: string;
  lastUpdatedAt: string;
  quantity: string;
  delivery: string;
  health: HealthStatus;
  contact: string;
  email: string;
  initials: string;
  color: string;
  currentSummary: string;
  confirmedInformation: string[];
  pendingInformation: string[];
  risks: string[];
  nextActions: string[];
};

export type Requirement = {
  id: string;
  projectId: number;
  product: string;
  field: string;
  fieldEn: string;
  value: string;
  status: RequirementStatus;
  source: "客户询盘" | "客户确认" | "样品反馈" | "内部记录";
  updatedAt: string;
};

export type Sample = {
  id: string;
  clientId: string;
  projectId: number;
  product: string;
  currentVersionId: string;
  currentVersion: string;
  status: SampleStatus;
  createdAt: string;
  sentDate?: string;
  feedbackStatus: string;
  nextAction: string;
  specs: Record<string, string>;
  sampleType?: "Initial Sample" | "Development Sample" | "Sales Sample" | "Bulk Approval Sample";
  owner?: string;
  targetDate?: string;
  logistics?: {
    versionId: string;
    courier?: string;
    trackingNumber?: string;
    expectedArrival?: string;
    receivedDate?: string;
    destination?: string;
    receiver?: string;
  };
  developmentCost?: {
    currency: "USD" | "EUR" | "CNY";
    sampleFee?: number;
    mouldFee?: number;
    courierFee?: number;
    testingFee?: number;
    other?: number;
  };
  designIn?: {
    customerIdea: string;
    application: string;
    reference: string;
    suggestedProduct: string;
    suggestedMaterial: string;
    suggestedProcess: string;
    notes: string;
    potential: string;
  };
};

export type SampleSpecification = {
  value: string;
  status: "Confirmed" | "Pending" | "Not Required";
};

export type SampleVersion = {
  id: string;
  sampleId: string;
  projectId: number;
  version: string;
  createdAt: string;
  sentDate?: string;
  status: SampleStatus;
  summary: string;
  changes: string[];
  specifications?: Record<string, SampleSpecification>;
  reasonForChange?: string;
  internalNote?: string;
  revisionFeedbackIds?: string[];
  reviewOutcome?: "Approved" | "Rejected";
};

export type SampleFeedback = {
  id: string;
  sampleId: string;
  sampleVersionId: string;
  projectId: number;
  receivedAt: string;
  author: string;
  channel: "Email" | "WhatsApp" | "Meeting";
  summary: string;
  details: string;
  requiresRevision: boolean;
  category?: "Color" | "Size" | "Material" | "Logo" | "Function" | "Testing" | "Quality" | "Design" | "Cost" | "Other";
  severity?: "Blocking" | "Important" | "Minor";
  requiredAction?: string;
  resolution?: "Open" | "Resolved";
  resolvedInVersionId?: string;
};

export type Quotation = {
  id: string;
  clientId: string;
  projectId: number;
  version: string;
  product: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: "USD" | "EUR" | "CNY";
  status: QuotationStatus;
  validUntil: string;
  issuedAt: string;
  targetPrice?: number;
  internalTargetPrice?: number;
  moq: number;
  incoterm: string;
  clientFeedback: string;
};

export type QuotationTier = {
  id: string;
  quotationId: string;
  minimumQuantity: number;
  maximumQuantity?: number;
  unitPrice: number;
  currency: "USD" | "EUR" | "CNY";
  note?: string;
};

export type NegotiationRecord = {
  id: string;
  quotationId: string;
  projectId: number;
  recordedAt: string;
  direction: "客户反馈" | "内部建议" | "销售回复";
  summary: string;
  nextAction: string;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  clientId: string;
  projectId: number;
  quotationId: string;
  amount: number;
  currency: "USD" | "EUR" | "CNY";
  poDate: string;
  deliveryDate: string;
  currentStage: OrderStage;
  health: HealthStatus;
  owner: string;
  paymentStatus: "未到期" | "部分付款" | "已付款";
};

export type OrderLine = {
  id: string;
  purchaseOrderId: string;
  product: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
};

export type Communication = {
  id: string;
  projectId: number;
  clientId: string;
  relatedEntityType?: "sample" | "quotation" | "po";
  relatedEntityId?: string;
  type: "客户邮件" | "聊天记录" | "电话记录" | "内部备注" | "样品反馈" | "报价反馈";
  occurredAt: string;
  author: string;
  subject: string;
  content: string;
  language: "中文" | "英文" | "中英对照";
};

export type Task = {
  id: string;
  projectId: number;
  relatedEntityType?: "sample" | "quotation" | "po" | "delivery" | "shipment";
  relatedEntityId?: string;
  title: string;
  owner: string;
  priority: "P1" | "P2" | "P3";
  dueDate: string;
  status: "待处理" | "进行中" | "已完成";
};

export type TimelineEvent = {
  id: string;
  projectId: number;
  clientId: string;
  type: TimelineEventType;
  relatedEntityId?: string;
  occurredAt: string;
  displayDate: string;
  title: string;
  description: string;
  icon: string;
};

export type Contract = {
  id: string;
  purchaseOrderId: string;
  projectId: number;
  contractNumber: string;
  status: "Draft" | "Reviewing" | "Confirmed";
  confirmedAt?: string;
  owner: string;
};

export type Delivery = {
  id: string;
  purchaseOrderId: string;
  projectId: number;
  plannedDate: string;
  actualDate?: string;
  quantity: number;
  status: "Pending" | "Ready" | "Delivered";
};

export type Shipment = {
  id: string;
  purchaseOrderId: string;
  projectId: number;
  method: string;
  destination: string;
  etd?: string;
  eta?: string;
  status: "Pending" | "Ready" | "Shipped" | "In Transit" | "Delivered";
  trackingNumber?: string;
};

export type WeeklyReport = {
  id: string;
  projectId: number;
  week: string;
  summary: string;
};

export type AIInsight = {
  id: string;
  projectId: number;
  relatedEntityType: "project" | "sample" | "quotation" | "po";
  relatedEntityId: string;
  title: string;
  content: string;
  generatedAt: string;
  mode: "mock";
};

export type BusinessCase = {
  client: Client;
  contacts: Contact[];
  project: Project;
  requirements: Requirement[];
  samples: Sample[];
  sampleVersions: SampleVersion[];
  sampleFeedback: SampleFeedback[];
  quotations: Quotation[];
  quotationTiers: QuotationTier[];
  negotiationRecords: NegotiationRecord[];
  purchaseOrders: PurchaseOrder[];
  orderLines: OrderLine[];
  contracts: Contract[];
  deliveries: Delivery[];
  shipments: Shipment[];
  communications: Communication[];
  tasks: Task[];
  timeline: TimelineEvent[];
  weeklyReports: WeeklyReport[];
  aiInsights: AIInsight[];
};
