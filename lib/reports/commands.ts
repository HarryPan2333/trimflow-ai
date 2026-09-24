import type { FinalReportDTO, ReportContextSnapshot, ReportDraft, ReportSection, ReportState } from "./types";
import type { ReportGenerator } from "./generator";
import { validateReportDraft } from "./validation";

const revisionOf = (reportId: string, action: "generated" | "saved" | "reviewed" | "finalized", at: string, sections: ReportSection[]) => ({ id: `${reportId}:${action}:${at}`, reportId, action, at, sections: structuredClone(sections) });

export function generateReport(state: ReportState, context: ReportContextSnapshot, generator: ReportGenerator, at: string, fromReportId?: string): { state: ReportState; draft: ReportDraft } {
  const previous = fromReportId ? state.drafts.find((item) => item.id === fromReportId) : undefined;
  const sequence = previous ? Math.max(...state.drafts.filter((item) => item.lineageId === previous.lineageId).map((item) => item.generationCount)) + 1 : 1;
  const id = previous ? `${previous.lineageId}:generation:${sequence}` : context.id.replace(/^context:/, "report:");
  if (state.drafts.some((item) => item.id === id) || state.contexts.some((item) => item.id === context.id)) throw new Error("Report or context ID already exists");
  const draft = generator.generate(context, id, at, sequence);
  draft.lineageId = previous?.lineageId ?? id;
  draft.revision = sequence;
  draft.validation = validateReportDraft(draft, context, at);
  return { draft, state: { contexts: [...state.contexts, structuredClone(context)], drafts: [...state.drafts, draft], finals: state.finals,
    revisions: [...state.revisions, revisionOf(id, "generated", at, draft.sections)] } };
}

export function editReportBlock(state: ReportState, reportId: string, blockId: string, text: { zh: string; en: string }, at: string): ReportState {
  const draft = state.drafts.find((item) => item.id === reportId);
  if (!draft || draft.status === "final") throw new Error("Final report is immutable");
  if (!draft.sections.some((section) => section.blocks.some((block) => block.id === blockId))) throw new Error("Block not found");
  const sections = draft.sections.map((section) => ({ ...section, blocks: section.blocks.map((block) => block.id !== blockId ? block : {
    ...block, text: { ...text }, kind: "human_note" as const, origin: "human" as const, validation: "needs_review" as const,
    memoryRevisionIds: [], factIds: [], aggregateCount: undefined, actionSource: undefined, actionKind: undefined,
  }) }));
  const context = state.contexts.find((item) => item.id === draft.contextSnapshotId)!;
  const edited: ReportDraft = { ...draft, sections, status: "draft", reviewedAt: undefined, reviewedByActorId: undefined, updatedAt: at };
  edited.validation = validateReportDraft(edited, context, at);
  return { ...state, drafts: state.drafts.map((item) => item.id === reportId ? edited : item), revisions: [...state.revisions, revisionOf(reportId, "saved", at, sections)] };
}

export function addReportHumanNote(state: ReportState, reportId: string, text: { zh: string; en: string }, at: string): ReportState {
  const draft = state.drafts.find((item) => item.id === reportId);
  if (!draft || draft.status === "final" || !text.zh.trim() || !text.en.trim()) throw new Error("Editable report and note text required");
  const block = { id: `${reportId}:note:${state.revisions.length + 1}`, kind: "human_note" as const, text, memoryRevisionIds: [], factIds: [], origin: "human" as const, validation: "needs_review" as const };
  const sections = [...draft.sections, { id: `human-notes-${state.revisions.length + 1}`, title: { zh: "人工补充", en: "Human Notes" }, blocks: [block] }];
  const context = state.contexts.find((item) => item.id === draft.contextSnapshotId)!;
  const edited: ReportDraft = { ...draft, sections, status: "draft", reviewedAt: undefined, reviewedByActorId: undefined, updatedAt: at };
  edited.validation = validateReportDraft(edited, context, at);
  return { ...state, drafts: state.drafts.map((item) => item.id === reportId ? edited : item), revisions: [...state.revisions, revisionOf(reportId, "saved", at, sections)] };
}

export function reviewReport(state: ReportState, reportId: string, actorId: string, at: string): ReportState {
  const draft = state.drafts.find((item) => item.id === reportId);
  if (!draft || draft.status !== "draft" || !actorId) throw new Error("Draft and reviewer required");
  const context = state.contexts.find((item) => item.id === draft.contextSnapshotId)!;
  const validation = validateReportDraft(draft, context, at);
  if (validation.issues.length) throw new Error(`Report validation failed: ${validation.issues.join(", ")}`);
  const reviewed: ReportDraft = { ...draft, status: "reviewed", reviewedByActorId: actorId, reviewedAt: at, validation, updatedAt: at };
  return { ...state, drafts: state.drafts.map((item) => item.id === reportId ? reviewed : item), revisions: [...state.revisions, revisionOf(reportId, "reviewed", at, reviewed.sections)] };
}

export function finalizeReport(state: ReportState, reportId: string, actorId: string, at: string): { state: ReportState; final: FinalReportDTO } {
  const draft = state.drafts.find((item) => item.id === reportId);
  if (!draft || draft.status !== "reviewed" || !actorId) throw new Error("Reviewed report and finalizer required");
  const context = state.contexts.find((item) => item.id === draft.contextSnapshotId)!;
  const validation = validateReportDraft(draft, context, at);
  if (validation.issues.length) throw new Error(`Report validation failed: ${validation.issues.join(", ")}`);
  const final: FinalReportDTO = structuredClone({ id: draft.id, revision: draft.revision, kind: draft.kind, ownerActorId: draft.ownerActorId, attributionMode: draft.attributionMode,
    period: draft.period, language: draft.language, sections: draft.sections, sourceSummary: context.memory.map((item) => ({ memoryRevisionId: item.id, summary: item.summary, evidence: item.evidence })),
    finalizedByActorId: actorId, finalizedAt: at, validation, syntheticData: true, contextSnapshotId: context.id });
  const finished: ReportDraft = { ...draft, status: "final", finalDraft: structuredClone(draft.sections), validation, updatedAt: at };
  return { final, state: { ...state, drafts: state.drafts.map((item) => item.id === reportId ? finished : item), finals: [...state.finals, final], revisions: [...state.revisions, revisionOf(reportId, "finalized", at, final.sections)] } };
}
