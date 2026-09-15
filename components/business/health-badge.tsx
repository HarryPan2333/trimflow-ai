"use client";

import { useI18n } from "../providers/language-provider";

type HealthBadgeProps = {
  status: string;
  label?: string;
  className?: string;
  showDot?: boolean;
};

function healthTone(status: string) {
  const normalized = status.toLowerCase();
  if (["healthy", "正常", "良好"].includes(normalized)) return "良好";
  if (["blocked", "阻塞"].includes(normalized)) return "风险";
  if (["at risk", "有风险", "关注", "风险"].includes(normalized)) return status === "关注" ? "关注" : "风险";
  return "关注";
}

export function HealthBadge({ status, label, className = "", showDot = true }: HealthBadgeProps) {
  const { label: localize } = useI18n();
  const tone = healthTone(status);
  return (
    <span className={`${className} health-${tone}`.trim()}>
      {showDot && "● "}
      {label ?? localize(status)}
    </span>
  );
}
