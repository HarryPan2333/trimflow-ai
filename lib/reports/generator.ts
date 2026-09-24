import type { ActivityMemoryItem } from "../activity-memory/types";
import type { ReportBlock, ReportContextSnapshot, ReportDraft, ReportSection } from "./types";

export interface ReportGenerator { readonly type: "demo" | "llm"; readonly version: string; generate(context: ReportContextSnapshot, reportId: string, at: string, generationCount: number): ReportDraft }
const labels = {
  customer_interaction: { zh: "客户沟通", en: "Customer Activities" },
  project_update: { zh: "项目进展", en: "Project Progress" },
  sample_update: { zh: "样品与产品开发", en: "Samples & Product Development" },
  commercial_update: { zh: "报价与商务", en: "Commercial & Quotation" },
  order_update: { zh: "订单与交付", en: "Orders & Delivery" },
  relationship_update: { zh: "联系人与引荐", en: "Contacts & Referrals" },
  task_update: { zh: "已完成与任务进展", en: "Completed Actions & Tasks" },
  internal_coordination: { zh: "内部协作", en: "Internal Coordination" },
} as const;
const english = (item: ActivityMemoryItem, context: ReportContextSnapshot) => {
  if (!/[\u3400-\u9fff]/.test(item.summary.en)) return item.summary.en;
  const scope = item.projectId === undefined ? context.entityLabels[`account:${item.accountId}`]?.en ?? "the account" : context.entityLabels[`project:${item.projectId}`]?.en ?? `project ${item.projectId}`;
  const fact = item.facts[0];
  if (fact?.kind === "sample_version") return `${scope}: sample ${fact.sampleId} version ${fact.versionId} created.`;
  if (fact?.kind === "sample_feedback") return `${scope}: feedback recorded for ${fact.versionId}; status ${fact.resolution}.`;
  if (fact?.kind === "quotation") return `${scope}: quotation ${fact.quotationId} ${fact.action}; ${fact.currency} ${fact.unitPrice} at ${fact.quantity} units.`;
  if (fact?.kind === "order_milestone") return `${scope}: ${fact.action.replaceAll("_", " ")} recorded for ${fact.orderId}.`;
  if (fact?.kind === "task_status") return `${scope}: task ${fact.taskId} ${fact.action}.`;
  return `${scope}: ${item.subtype.replaceAll("_", " ")} recorded.`;
};
const factBlock = (item: ActivityMemoryItem, context: ReportContextSnapshot, index: number): ReportBlock => ({
  id: `${context.id}:block:${index}`, kind: item.manual ? "human_note" : "fact",
  text: { zh: item.summary.zh, en: english(item, context) }, memoryRevisionIds: [item.id], factIds: item.facts.map((fact) => fact.id),
  origin: item.manual ? "human" : "demo_generator", validation: item.manual ? "needs_review" : "valid",
});

export class DemoReportGenerator implements ReportGenerator {
  readonly type = "demo" as const;
  readonly version = "demo-1";
  generate(context: ReportContextSnapshot, reportId: string, at: string, generationCount: number): ReportDraft {
    const memory = [...context.memory].sort((a, b) => (a.occurred.kind === "unknown" ? "" : a.occurred.value).localeCompare(b.occurred.kind === "unknown" ? "" : b.occurred.value));
    const sections: ReportSection[] = [];
    const verified = memory.filter((item) => !item.manual);
    if (context.period.kind === "weekly" && verified.length) sections.push({ id: "highlights", title: { zh: "本周重点", en: "Weekly Highlights" }, blocks: [{ id: `${reportId}:highlights`, kind: "fact", text: { zh: `本周有 ${verified.length} 项可追溯的业务活动，涉及 ${new Set(verified.map((item) => item.projectId).filter(Boolean)).size} 个项目。`, en: `${verified.length} traceable business activities across ${new Set(verified.map((item) => item.projectId).filter(Boolean)).size} projects this week.` }, memoryRevisionIds: verified.map((item) => item.id), factIds: verified.flatMap((item) => item.facts.map((fact) => fact.id)), origin: "demo_generator", validation: "valid", aggregateCount: verified.length }] });
    for (const category of Object.keys(labels) as Array<keyof typeof labels>) {
      const matches = memory.filter((item) => item.category === category);
      if (!matches.length) continue;
      if (context.period.kind === "daily") sections.push({ id: category, title: labels[category], blocks: matches.map((item, index) => factBlock(item, context, index)) });
      else {
        const grouped = new Map<string, ActivityMemoryItem[]>();
        for (const item of matches) { const key = `${item.accountId ?? ""}:${item.projectId ?? ""}:${item.manual ? item.id : "verified"}`; grouped.set(key, [...(grouped.get(key) ?? []), item]); }
        sections.push({ id: category, title: labels[category], blocks: [...grouped.values()].map((items, index) => {
          const blocks = items.map((item, itemIndex) => factBlock(item, context, itemIndex));
          const projectLabel = items[0].projectId === undefined ? context.entityLabels[`account:${items[0].accountId}`]?.zh ?? "客户" : context.entityLabels[`project:${items[0].projectId}`]?.zh ?? "项目";
          const projectEn = items[0].projectId === undefined ? context.entityLabels[`account:${items[0].accountId}`]?.en ?? "Account" : context.entityLabels[`project:${items[0].projectId}`]?.en ?? "Project";
          return { id: `${reportId}:${category}:${index}`, kind: items.some((item) => item.manual) ? "human_note" as const : "fact" as const,
            text: { zh: `${projectLabel}：${blocks.map((block) => block.text.zh).join("；")}`, en: `${projectEn}: ${blocks.map((block) => block.text.en).join("; ")}` },
            memoryRevisionIds: items.map((item) => item.id), factIds: items.flatMap((item) => item.facts.map((fact) => fact.id)), origin: items.some((item) => item.manual) ? "human" as const : "demo_generator" as const,
            validation: items.some((item) => item.manual) ? "needs_review" as const : "valid" as const, aggregateCount: items.length };
        }) });
      }
    }
    if (context.openTasks.length) sections.push({ id: "next_actions", title: { zh: context.period.kind === "weekly" ? "下周关注" : "后续行动", en: context.period.kind === "weekly" ? "Next Week Focus" : "Next Actions" }, blocks: context.openTasks.slice(0, 6).map((task) => ({ id: `${reportId}:task:${task.id}`, kind: "recommendation" as const,
      text: { zh: `现有待办：${task.title}${task.dueDate ? `（截止 ${task.dueDate}）` : ""}`, en: `Existing task ${task.id}${task.dueDate ? ` (due ${task.dueDate})` : ""}.` }, memoryRevisionIds: [], factIds: [], origin: "demo_generator" as const,
      validation: "valid" as const, actionKind: "existing_task" as const, actionSource: task.source })), });
    return { id: reportId, lineageId: reportId, revision: 1, kind: context.period.kind, ownerActorId: context.ownerActorId, attributionMode: context.attributionMode, period: context.period, language: context.language,
      generatorType: "demo", generatorVersion: this.version, contextSnapshotId: context.id, sections, validation: { issues: [], warnings: [], validatedAt: at },
      status: "draft", createdAt: at, updatedAt: at, generationStartedAt: at, generatedAt: at, generationCount, initialDraft: structuredClone(sections) };
  }
}
