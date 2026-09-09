import { Badge } from "../ui/primitives";

const toneByStatus: Record<string, string> = {
  inquiry: "blue",
  requirement: "amber",
  sample: "purple",
  quotation: "cyan",
  negotiation: "orange",
  negotiating: "orange",
  po: "green",
  delivery: "cyan",
  shipment: "blue",
  completed: "green",
  draft: "neutral",
  pending: "amber",
  confirmed: "green",
  accepted: "green",
  rejected: "red",
  expired: "neutral",
  新询盘: "blue",
  需求确认: "amber",
  打样中: "purple",
  报价中: "cyan",
  谈判中: "orange",
  已确认订单: "green",
  暂停或流失: "neutral",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = toneByStatus[status] ?? toneByStatus[status.toLowerCase()] ?? "neutral";
  return <Badge tone={tone}>{label ?? status}</Badge>;
}
