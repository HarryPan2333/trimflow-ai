import { projectRequirements } from "../mock-data";
import type { BusinessExtractionProposal, DealRoom, DealRoomMessage, DealRoomState } from "./types";

export interface BusinessExtractionEngine {
  extract(message: DealRoomMessage, room: DealRoom): BusinessExtractionProposal[];
}

// Explicit demo rules; not a model, inference service, or source of confirmed facts.
export class DemoExtractionAdapter implements BusinessExtractionEngine {
  extract(message: DealRoomMessage, room: DealRoom): BusinessExtractionProposal[] {
    const source = message.content.en;
    const base = { roomId: room.id, sourceMessageIds: [message.id], createdAt: message.createdAt, status: "suggested" as const };
    const result: BusinessExtractionProposal[] = [];
    if (room.projectId !== undefined) {
      const price = source.match(/\b(USD|EUR|CNY)\s*(\d+(?:\.\d+)?)\b[^\n]*?\b([\d,]+)\s*(pcs|pieces|sets|units)\b/i);
      if (price) result.push({ ...base, id: `proposal-${message.id}-price`, proposalType: "target_price", confidenceState: "needs_review", extractedFields: { currency: price[1].toUpperCase() as "USD" | "EUR" | "CNY", unitPrice: Number(price[2]), quantity: Number(price[3].replaceAll(",", "")), unit: price[4], context: source }, target: { kind: "commercial_signal", projectId: room.projectId } });
      const version = message.businessContextRefs?.find((item) => item.kind === "sample_version")?.id;
      const sample = message.businessContextRefs?.find((item) => item.kind === "sample")?.id;
      if (message.kind === "sample_feedback" && sample && version) result.push({ ...base, id: `proposal-${message.id}-feedback`, proposalType: "sample_feedback", confidenceState: "needs_review", extractedFields: { sampleId: sample, sampleVersionId: version, summary: source, requestedChange: source }, target: { kind: "sample_feedback", sampleId: sample, sampleVersionId: version } });
      if (/\b(follow up|send revised|next action)\b/i.test(source) || /跟进|发送修改/.test(message.content.zh)) result.push({ ...base, id: `proposal-${message.id}-action`, proposalType: "next_action", confidenceState: "needs_review", extractedFields: { title: source }, target: { kind: "task", projectId: room.projectId } });
      if (/\b(180\s?gsm|matte finish)\b/i.test(source)) {
        const requirement = projectRequirements.find((item) => item.projectId === room.projectId && (source.includes("180") ? item.fieldEn === "Weight" : item.fieldEn === "Surface Finish"));
        if (requirement) result.push({ ...base, id: `proposal-${message.id}-requirement`, proposalType: "requirement_update", confidenceState: "ambiguous", extractedFields: { requirementId: requirement.id, value: source.includes("180") ? "180 gsm (pending customer confirmation)" : "Matte finish (pending customer confirmation)", note: source }, target: { kind: "project_requirement", projectId: room.projectId } });
      }
    }
    if (message.kind === "meeting_note") result.push({ ...base, id: `proposal-${message.id}-meeting`, proposalType: "meeting_summary", confidenceState: "ambiguous", extractedFields: { keyUpdates: source, customerRequirements: "", commercialSignals: "", sampleChanges: "", nextActions: "", openQuestions: "" }, target: { kind: "account_activity", accountId: room.accountId } });
    else if (message.kind === "customer_update" && !result.some((item) => item.proposalType === "target_price")) result.push({ ...base, id: `proposal-${message.id}-update`, proposalType: "customer_update", confidenceState: "needs_review", extractedFields: { summary: source }, target: { kind: "account_activity", accountId: room.accountId } });
    return result;
  }
}

export function extractDemoSuggestions(state: DealRoomState, roomId: string, engine: BusinessExtractionEngine = new DemoExtractionAdapter()) {
  const room = state.rooms.find((item) => item.id === roomId);
  if (!room) throw new Error("Room not found");
  const used = new Set(state.proposals.flatMap((item) => item.sourceMessageIds));
  return state.messages.filter((item) => item.roomId === roomId && !used.has(item.id)).flatMap((message) => engine.extract(message, room));
}
