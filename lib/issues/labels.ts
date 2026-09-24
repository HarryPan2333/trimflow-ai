import type { Language, LocalizedText } from "../i18n";
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
  sample: { zh: "样品", en: "Sample" }, sample_version: { zh: "样品版本", en: "Sample version" },
  sample_feedback: { zh: "样品反馈", en: "Sample feedback" }, deal_message: { zh: "团队讨论", en: "Team discussion" },
  purchase_order: { zh: "采购订单", en: "Purchase order" }, order_issue: { zh: "订单执行记录", en: "Order execution record" },
  order_line: { zh: "订单行", en: "Order line" }, product: { zh: "产品", en: "Product" }, variant: { zh: "产品变体", en: "Product variant" },
} satisfies Record<string, LocalizedText>;

const issueErrorLabels: Record<string, LocalizedText> = {
  account_not_found: { zh: "未找到关联客户", en: "The linked account was not found" },
  project_not_found: { zh: "未找到关联项目", en: "The linked project was not found" },
  account_project_mismatch: { zh: "客户与项目不匹配", en: "The account and project do not match" },
  sample_not_found: { zh: "未找到关联样品", en: "The linked sample was not found" },
  sample_scope_mismatch: { zh: "样品与客户或项目不匹配", en: "The sample does not belong to this account or project" },
  sample_version_mismatch: { zh: "样品版本不属于所选样品", en: "The sample version does not belong to the selected sample" },
  sample_feedback_mismatch: { zh: "样品反馈与所选版本不匹配", en: "The sample feedback does not match the selected version" },
  order_not_found: { zh: "未找到关联订单", en: "The linked order was not found" },
  order_scope_mismatch: { zh: "订单与客户或项目不匹配", en: "The order does not belong to this account or project" },
  order_line_mismatch: { zh: "订单行与所选订单不匹配", en: "The order line does not belong to the selected order" },
  product_not_found: { zh: "未找到关联产品", en: "The linked product was not found" },
  product_project_mismatch: { zh: "产品与项目不匹配", en: "The product is not linked to this project" },
  variant_mismatch: { zh: "产品变体不匹配", en: "The product variant does not match" },
  revision_mismatch: { zh: "设计版本不匹配", en: "The design revision does not match" },
  invalid_severity: { zh: "请选择有效的严重程度", en: "Select a valid severity" },
  content_required: { zh: "请填写中英文问题标题与说明", en: "Enter the issue title and description in both languages" },
  owner_required: { zh: "请选择负责人", en: "Select an owner" },
  unknown_cause_has_summary: { zh: "未确认的根因不能填写确定结论", en: "An unknown root cause cannot have a conclusion" },
  cause_summary_required: { zh: "请填写根因说明", en: "Enter a root-cause summary" },
  resolution_required: { zh: "请先记录解决结果", en: "Record the resolution first" },
  issue_not_found: { zh: "未找到该问题", en: "The issue was not found" },
  duplicate_issue: { zh: "问题编号已存在", en: "This issue ID already exists" },
  source_not_found: { zh: "未找到关联的来源记录", en: "A linked source record was not found" },
  new_issue_must_be_open: { zh: "新问题应从待分诊开始", en: "A new issue must start as open" },
  invalid_status_transition: { zh: "当前状态不允许这项变更", en: "This status change is not allowed" },
  confirmed_cause_requires_evidence: { zh: "确认根因需要选择来源证据", en: "Confirming a root cause requires source evidence" },
  duplicate_action: { zh: "该纠正行动已存在", en: "This corrective action already exists" },
  action_not_open: { zh: "该行动已完成或不存在", en: "This action is completed or missing" },
  acceptance_evidence_required: { zh: "记录客户接受需要明确来源", en: "Customer acceptance requires explicit evidence" },
  duplicate_response: { zh: "该沟通记录已存在", en: "This response already exists" },
  already_resolved: { zh: "该问题已解决或关闭", en: "This issue is already resolved or closed" },
  resolution_fields_required: { zh: "请填写处理内容、内部经验和负责人", en: "Enter the resolution, internal lesson, and owner" },
  customer_acceptance_not_evidenced: { zh: "尚无客户明确接受的证据", en: "There is no evidence of explicit customer acceptance" },
  invalid_suggestion: { zh: "问题线索无效或已存在", en: "The issue suggestion is invalid or already exists" },
  suggestion_source_mismatch: { zh: "协作室消息与客户项目不匹配", en: "The Deal Room message does not match the account and project" },
  suggestion_not_open: { zh: "该线索已审核或不存在", en: "This suggestion has already been reviewed or is missing" },
  suggestion_issue_mismatch: { zh: "新问题与已审核线索不匹配", en: "The issue does not match the reviewed suggestion" },
  product_improvement_scope_mismatch: { zh: "产品改进建议需要关联已解决的问题", en: "A product suggestion requires a resolved linked issue" },
  improvement_not_pending: { zh: "该产品建议已处理或不存在", en: "This product suggestion has already been handled or is missing" },
  playbook_not_found: { zh: "未找到经验条目", en: "The playbook was not found" },
  resolved_issue_required: { zh: "只有已解决的问题才能生成经验草稿", en: "Only a resolved issue can create a playbook draft" },
  active_playbook_exists: { zh: "该问题已有未归档的经验条目", en: "This issue already has an active playbook" },
  playbook_not_editable: { zh: "已发布或归档的经验不能编辑", en: "A published or archived playbook cannot be edited" },
  draft_required: { zh: "请先保存为草稿", en: "Save a draft first" },
  resolved_source_required: { zh: "来源问题必须保持已解决状态", en: "Source issues must remain resolved" },
  resolution_evidence_required: { zh: "解决记录需要来源证据", en: "The resolution requires source evidence" },
  evidence_required: { zh: "经验条目需要来源证据", en: "The playbook requires source evidence" },
  human_review_required: { zh: "发布前必须经过人工审核", en: "Human review is required before publication" },
  published_required: { zh: "只能归档已发布的经验", en: "Only a published playbook can be archived" },
};
export function formatIssueError(error: unknown, language: Language): string {
  const codes = (error instanceof Error ? error.message : String(error)).split(",");
  return codes.map((code) => issueErrorLabels[code.trim()]?.[language] ?? (language === "zh" ? "操作未完成，请核对输入与关联资料" : "Action failed; check the input and linked records")).join("；");
}
