import type { LocalizedText } from "../i18n";
import type { CustomerOutcome, FactCertainty, IssueCustomerResponse, IssueEvent, IssueSeverity, IssueStatus, IssueType, RootCauseStatus, ResolutionOutcome } from "./types";

export const issueTypeLabels: Record<IssueType, LocalizedText> = {
  color_deviation: { zh: "颜色偏差", en: "Color deviation" }, dimension_deviation: { zh: "尺寸偏差", en: "Dimension deviation" },
  performance_failure: { zh: "性能问题", en: "Performance issue" }, material_issue: { zh: "材料 / 规格问题", en: "Material / specification" },
  logo_issue: { zh: "Logo 问题", en: "Logo issue" }, sample_mismatch: { zh: "样品不符", en: "Sample mismatch" },
  production_delay: { zh: "生产延期", en: "Production delay" }, shipment_delay: { zh: "出货延期", en: "Shipment delay" },
  quantity_shortage: { zh: "数量短缺", en: "Quantity shortage" }, packaging_issue: { zh: "包装待确认", en: "Packaging issue" },
  documentation_issue: { zh: "文件问题", en: "Documentation issue" }, other: { zh: "其他", en: "Other" },
};
export const severityLabels: Record<IssueSeverity, LocalizedText> = {
  low: { zh: "低", en: "Low" }, medium: { zh: "中", en: "Medium" }, high: { zh: "高", en: "High" }, critical: { zh: "紧急", en: "Critical" },
};
export const statusLabels: Record<IssueStatus, LocalizedText> = {
  open: { zh: "待分诊", en: "Open" }, triaging: { zh: "分诊中", en: "Triaging" }, investigating: { zh: "调查中", en: "Investigating" },
  action_in_progress: { zh: "处理中", en: "Action in progress" }, waiting_customer: { zh: "等待客户", en: "Waiting for customer" },
  resolved: { zh: "已解决", en: "Resolved" }, closed: { zh: "已关闭", en: "Closed" },
};
export const causeLabels: Record<RootCauseStatus, LocalizedText> = {
  unknown: { zh: "尚未确认", en: "Unknown" }, suspected: { zh: "推测", en: "Suspected" }, confirmed: { zh: "已证实", en: "Confirmed" },
};
export const resolutionLabels: Record<ResolutionOutcome, LocalizedText> = {
  resolved: { zh: "已解决", en: "Resolved" }, accepted_with_exception: { zh: "例外接受", en: "Accepted with exception" },
  replacement_sent: { zh: "替换品已寄出", en: "Replacement sent" }, rework_completed: { zh: "返工完成", en: "Rework completed" },
  commercial_adjustment: { zh: "商务调整", en: "Commercial adjustment" }, cancelled: { zh: "已取消", en: "Cancelled" },
};
export const playbookStatusLabels = {
  draft: { zh: "草稿", en: "Draft" }, reviewed: { zh: "已审核", en: "Reviewed" },
  published: { zh: "已发布", en: "Published" }, archived: { zh: "已归档", en: "Archived" },
} satisfies Record<string, LocalizedText>;
export const certaintyLabels: Record<FactCertainty, LocalizedText> = {
  reported: { zh: "已报告，待核实", en: "Reported, not verified" }, suspected: { zh: "推测影响", en: "Suspected impact" }, confirmed: { zh: "已证实", en: "Confirmed" },
};
export const customerOutcomeLabels: Record<CustomerOutcome, LocalizedText> = {
  pending: { zh: "客户结果待确认", en: "Customer outcome pending" }, accepted: { zh: "客户已明确接受", en: "Explicitly accepted" },
  rejected: { zh: "客户未接受", en: "Not accepted" }, not_required: { zh: "不适用", en: "Not required" },
};
export const responseTypeLabels: Record<IssueCustomerResponse["type"], LocalizedText> = {
  acknowledged: { zh: "已告知", en: "Acknowledged" }, corrective_plan: { zh: "纠正方案", en: "Corrective plan" },
  replacement_sample: { zh: "替换样品", en: "Replacement sample" }, revised_delivery: { zh: "交期更新", en: "Delivery update" },
  accepted_resolution: { zh: "接受结果", en: "Accepted resolution" }, other: { zh: "其他", en: "Other" },
};
export const eventKindLabels: Record<IssueEvent["kind"], LocalizedText> = {
  issue_reported: { zh: "问题记录", en: "Issue recorded" }, status_changed: { zh: "状态更新", en: "Status changed" },
  root_cause_updated: { zh: "根因判断", en: "Root cause assessed" }, action_completed: { zh: "行动完成", en: "Action completed" },
  customer_response: { zh: "客户回复", en: "Customer response" }, customer_accepted: { zh: "客户明确接受", en: "Customer accepted" },
  issue_resolved: { zh: "问题解决", en: "Issue resolved" }, issue_closed: { zh: "问题关闭", en: "Issue closed" },
};
export const suggestionStatusLabels = {
  suggested: { zh: "待审核", en: "Suggested" }, reviewed: { zh: "已审核", en: "Reviewed" },
  dismissed: { zh: "已忽略", en: "Dismissed" }, applied: { zh: "已创建问题", en: "Issue created" },
} satisfies Record<string, LocalizedText>;
export const improvementStatusLabels = {
  pending: { zh: "待审核", en: "Pending" }, reviewed: { zh: "已审核", en: "Reviewed" }, dismissed: { zh: "已忽略", en: "Dismissed" },
} satisfies Record<string, LocalizedText>;
export const sourceKindLabels = {
  sample_version: { zh: "样品版本", en: "Sample version" }, sample_feedback: { zh: "样品反馈", en: "Sample feedback" }, deal_message: { zh: "团队讨论", en: "Team discussion" },
} satisfies Record<string, LocalizedText>;
