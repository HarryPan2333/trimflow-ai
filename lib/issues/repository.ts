import type { Issue, IssueWorkspace } from "./types";

const ref = (recordType: string, recordId: string) => ({ provider: "trimflow" as const, recordType, recordId });
const both = (zh: string, en: string) => ({ zh, en });

const nas: Issue = {
  id: "IS-NAS-COLOR-01", accountId: "client-nas", projectId: 1, sampleId: "SP-NAS-2407", sampleVersionId: "SP-NAS-2407-V1", sampleFeedbackId: "fb-nas-v1-01", productId: "prod-waterproof",
  type: "color_deviation", severity: "medium", status: "resolved", title: both("V1 灰色与膜面偏离预期", "V1 gray shade and finish differed from expectation"),
  description: both("客户反馈 V1 灰色偏冷、膜面偏亮；黑色可接受。", "The client reported that V1 gray was too cool and the film too glossy; black was acceptable."),
  customerSafeSummary: both("V1 灰色和膜面已按反馈调整。", "The V1 gray shade and finish were adjusted based on feedback."),
  detectedAt: "2026-07-18", reportedAt: "2026-07-18", ownerActorId: "actor-sales-a", customerImpact: { dimensions: ["sample_rework"], certainty: "reported", description: both("V1 需调整外观；不代表整个样品未获批准。", "V1 appearance required revision; this does not determine approval of the whole sample.") },
  rootCauseStatus: "unknown", resolution: { outcome: "rework_completed", whatDone: both("V2 调暖灰色色相并降低膜面光泽。", "V2 adjusted the gray shade warmer and reduced film gloss."), customerOutcome: both("V2 反馈确认颜色与光泽；客户另要求洗后测试和 Logo 调整。", "V2 feedback accepted color and finish; wash testing and logo adjustment remained separate."), customerOutcomeStatus: "accepted", internalLessons: both("类似色差应先核对客户参照样与光泽方向。", "In similar color cases, first compare the client reference and finish expectation."), resolvedByActorId: "actor-sales-a", resolvedAt: "2026-07-28", sourceRefs: [ref("sample_version", "SP-NAS-2407-V2"), ref("sample_feedback", "fb-nas-v2-01")] },
  createdAt: "2026-07-18", updatedAt: "2026-07-28", sourceRefs: [ref("sample_feedback", "fb-nas-v1-01"), ref("sample_version", "SP-NAS-2407-V2"), ref("sample_feedback", "fb-nas-v2-01")],
};
const efc: Issue = {
  id: "IS-EFC-MARK-01", accountId: "client-efc", projectId: 2, orderId: "po-efc-2411", orderLineId: "line-efc-01", productId: "prod-snap",
  type: "packaging_issue", severity: "low", status: "open", title: both("订单外箱唛头尚未确认", "Carton marking remains unconfirmed"),
  description: both("现有订单执行记录提示最终外箱唛头尚未确认；包装前需取得文件。", "The order execution record notes that final carton marking is unconfirmed; files are needed before packing."),
  customerSafeSummary: both("最终外箱唛头仍待确认。", "Final carton marking remains to be confirmed."),
  detectedAt: "2026-08-05", ownerActorId: "actor-sales-a", customerImpact: { dimensions: ["production_risk"], certainty: "suspected", description: both("当前不影响材料准备；包装阶段存在待确认依赖，尚无已发生延误。", "Material preparation is unaffected; packing has an open dependency, with no recorded delay.") },
  rootCauseStatus: "unknown", createdAt: "2026-08-05", updatedAt: "2026-08-05", sourceRefs: [ref("order_issue", "issue-efc-mark"), ref("purchase_order", "po-efc-2411")],
};
const eyw: Issue = {
  id: "IS-EYW-WEIGHT-01", accountId: "client-eyw", projectId: 3, sampleId: "SP-EYW-2502-WEB", sampleVersionId: "SP-EYW-2502-WEB-V1", productId: "prod-tape",
  type: "material_issue", severity: "medium", status: "investigating", title: both("弹力织带克重待确认", "Elastic tape weight needs confirmation"),
  description: both("V1 规格中的克重仍为待确认；这是内部规格阻塞，不是已确认的客户索赔。", "V1 weight is pending in the specification; this is an internal specification blocker, not a confirmed customer claim."),
  detectedAt: "2026-07-25", ownerActorId: "actor-sales-c", customerImpact: { dimensions: ["approval_delay"], certainty: "suspected", description: both("正式制作需等待克重确认；尚未记录客户交期延误。", "Formal sample making waits for weight confirmation; no customer delivery delay is recorded.") },
  rootCauseStatus: "unknown", createdAt: "2026-07-25", updatedAt: "2026-07-25", sourceRefs: [ref("sample_version", "SP-EYW-2502-WEB-V1"), ref("sample", "SP-EYW-2502-WEB")],
};

export function createIssueWorkspace(): IssueWorkspace {
  const issues = [nas, efc, eyw];
  return structuredClone({
    issues,
    actions: [
      { id: "IA-NAS-V2", issueId: nas.id, type: "sample_revision", ownerActorId: "actor-sales-a", description: both("按 V1 反馈调整灰色与膜面", "Revise gray shade and finish from V1 feedback"), status: "completed", completedAt: "2026-07-20", createdAt: "2026-07-18", sourceRefs: [ref("sample_version", "SP-NAS-2407-V2")] },
      { id: "IA-EFC-MARK", issueId: efc.id, type: "customer_update", ownerActorId: "actor-sales-a", description: both("向客户取得最终外箱唛头文件", "Obtain final carton marking artwork from the client"), status: "open", dueAt: "2026-08-15", createdAt: "2026-08-05", sourceRefs: [ref("order_issue", "issue-efc-mark")] },
      { id: "IA-EYW-WEIGHT", issueId: eyw.id, type: "check", ownerActorId: "actor-sales-c", description: both("确认弹力织带克重后再安排制作", "Confirm elastic tape weight before making the sample"), status: "open", createdAt: "2026-07-25", sourceRefs: [ref("sample_version", "SP-EYW-2502-WEB-V1")] },
    ],
    responses: [],
    events: [
      { id: "IE-NAS-1", issueId: nas.id, kind: "issue_reported", at: "2026-07-18", summary: nas.description, sourceRefs: [ref("sample_feedback", "fb-nas-v1-01")], reportingRole: "background" },
      { id: "IE-NAS-2", issueId: nas.id, kind: "action_completed", at: "2026-07-20", actorId: "actor-sales-a", summary: both("V2 已调整灰色与光泽", "V2 gray and gloss adjustments completed"), sourceRefs: [ref("sample_version", "SP-NAS-2407-V2")], relatedId: "IA-NAS-V2", reportingRole: "background" },
      { id: "IE-NAS-3", issueId: nas.id, kind: "issue_resolved", at: "2026-07-28", actorId: "actor-sales-a", summary: both("客户在 V2 反馈中确认颜色与光泽", "V2 feedback accepted the color and finish"), sourceRefs: [ref("sample_feedback", "fb-nas-v2-01")], reportingRole: "background" },
      { id: "IE-EFC-1", issueId: efc.id, kind: "issue_reported", at: "2026-08-05", summary: efc.description, sourceRefs: [ref("order_issue", "issue-efc-mark")], reportingRole: "activity" },
      { id: "IE-EYW-1", issueId: eyw.id, kind: "issue_reported", at: "2026-07-25", summary: eyw.description, sourceRefs: [ref("sample_version", "SP-EYW-2502-WEB-V1")], reportingRole: "background" },
    ],
    suggestions: [], improvements: [], playbooks: [],
  } as IssueWorkspace);
}
