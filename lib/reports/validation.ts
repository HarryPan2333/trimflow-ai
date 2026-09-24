import type { ReportContextSnapshot, ReportDraft, ReportValidation } from "./types";

export function validateReportDraft(draft: ReportDraft, context: ReportContextSnapshot, at: string): ReportValidation {
  const issues: string[] = [];
  const warnings: string[] = [];
  if (draft.contextSnapshotId !== context.id || draft.ownerActorId !== context.ownerActorId || draft.attributionMode !== context.attributionMode || draft.period.startInclusive !== context.period.startInclusive || draft.period.endExclusive !== context.period.endExclusive) issues.push("report_context_mismatch");
  const memory = new Map(context.memory.map((item) => [item.id, item]));
  for (const section of draft.sections) for (const block of section.blocks) {
    if (!block.text.zh.trim() || !block.text.en.trim()) issues.push(`empty_block:${block.id}`);
    if (block.kind === "fact") {
      if (!block.memoryRevisionIds.length || !block.factIds.length) issues.push(`fact_without_source:${block.id}`);
      const refs = block.memoryRevisionIds.map((id) => memory.get(id));
      if (refs.some((item) => !item || item.status !== "active" || !item.evidence.some((ref) => ref.role === "primary"))) issues.push(`invalid_memory_reference:${block.id}`);
      const supported = new Set(refs.flatMap((item) => item?.facts.map((fact) => fact.id) ?? []));
      if (block.factIds.some((id) => !supported.has(id))) issues.push(`unsupported_fact_reference:${block.id}`);
      if (block.aggregateCount !== undefined && block.aggregateCount !== new Set(block.memoryRevisionIds).size) issues.push(`aggregate_count_mismatch:${block.id}`);
    }
    if (block.kind === "human_note") warnings.push(`human_note_unverified:${block.id}`);
    if (block.kind === "recommendation" && block.actionKind === "existing_task" && !context.openTasks.some((task) => task.source.recordId === block.actionSource?.recordId)) issues.push(`unknown_existing_task:${block.id}`);
    if (block.validation === "blocked") issues.push(`blocked_block:${block.id}`);
  }
  return { issues: [...new Set(issues)], warnings, validatedAt: at };
}
