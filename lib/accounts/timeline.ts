import { timelineEvents } from "../mock-data";
import { localizeNarrative } from "../i18n";
import type { AccountState, AccountTimelineItem } from "./types";
import { getAccountSourceIds } from "./selectors";

const eventLabel: Record<AccountState["events"][number]["type"], { zh: string; en: string }> = {
  discovery_recorded: { zh: "记录首次发现", en: "Discovery recorded" }, ownership_claimed: { zh: "认领客户", en: "Account claimed" }, ownership_transferred: { zh: "移交负责人", en: "Ownership transferred" }, ownership_released: { zh: "释放负责人", en: "Ownership released" }, collaboration_requested: { zh: "请求协作", en: "Collaboration requested" }, collaboration_accepted: { zh: "协作已接受", en: "Collaboration accepted" }, collaboration_rejected: { zh: "协作已拒绝", en: "Collaboration rejected" }, team_member_added: { zh: "新增团队成员", en: "Team member added" }, team_member_removed: { zh: "移除团队成员", en: "Team member removed" }, duplicate_confirmed: { zh: "确认重复客户", en: "Duplicate confirmed" }, accounts_merged: { zh: "客户档案已合并", en: "Accounts merged" }, separate_account_confirmed: { zh: "确认独立客户", en: "Separate account confirmed" }, referral_recorded: { zh: "记录联系人引荐", en: "Referral recorded" },
};

export function getAccountTimeline(state: AccountState, accountId: string): AccountTimelineItem[] {
  const sources = new Set(getAccountSourceIds(state, accountId));
  const items: AccountTimelineItem[] = [
    ...state.events.filter((item) => sources.has(item.accountId)).map((item) => ({ id: item.id, accountId, occurredAt: item.occurredAt, type: item.type, title: eventLabel[item.type], source: "event" as const })),
    ...state.activities.filter((item) => sources.has(item.accountId)).map((item) => ({ id: item.id, accountId, occurredAt: item.occurredAt, type: item.type, title: item.title, detail: item.detail, source: "activity" as const })),
    ...state.discoveries.filter((item) => sources.has(item.accountId)).map((item) => ({ id: item.id, accountId, occurredAt: item.discoveredAt, type: "discovery", title: { zh: "发现客户", en: "Account discovered" }, detail: item.sourceDetail, source: "discovery" as const })),
    ...state.referrals.filter((item) => sources.has(item.accountId)).map((item) => ({ id: item.id, accountId, occurredAt: item.introducedAt, type: "referral", title: { zh: "联系人引荐", en: "Contact referral" }, detail: item.sourceDetail, source: "referral" as const })),
    ...timelineEvents.filter((item) => sources.has(item.clientId)).map((item) => ({ id: item.id, accountId, occurredAt: item.occurredAt, type: item.type, title: { zh: item.title, en: localizeNarrative(item.title, "en") }, detail: { zh: item.description, en: localizeNarrative(item.description, "en") }, source: "project" as const })),
  ];
  return items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
}
