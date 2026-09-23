import { clients, contacts } from "../mock-data";
import type { Account, AccountState, Actor, ContactAffiliation, ContactPerson } from "./types";

const actors: Actor[] = [
  { id: "actor-sales-a", displayName: { zh: "演示销售 A", en: "Demo Sales A" }, functionTags: ["sales"], active: true },
  { id: "actor-sales-b", displayName: { zh: "演示销售 B", en: "Demo Sales B" }, functionTags: ["sales"], active: true },
  { id: "actor-sales-c", displayName: { zh: "演示销售 C", en: "Demo Sales C" }, functionTags: ["sales"], active: true },
  { id: "actor-merch-a", displayName: { zh: "演示跟单 A", en: "Demo Merchandiser A" }, functionTags: ["merchandising", "support"], active: true },
  { id: "actor-design-a", displayName: { zh: "演示设计 A", en: "Demo Designer A" }, functionTags: ["design", "technical"], active: true },
];

const accountDetails: Record<string, Pick<Account, "kind" | "aliases" | "domains" | "lifecycle" | "groupId">> = {
  "client-nas": { kind: "brand", aliases: ["NAS Demo Brand"], domains: ["nas.example.com"], lifecycle: "active" },
  "client-efc": { kind: "brand", aliases: [], domains: ["efc.example.com"], lifecycle: "active", groupId: "group-demo-fashion" },
  "client-eyw": { kind: "brand", aliases: [], domains: ["eyw.example.com"], lifecycle: "active" },
};

const canonicalAccounts: Account[] = clients.map((client) => ({ ...client, ...accountDetails[client.id], workspaceId: "demo", recordStatus: "canonical", revision: 1 }));
const prospect: Account = { id: "account-prospect", workspaceId: "demo", code: "PR-DEMO-01", name: "Unassigned Demo Prospect", country: "Canada", region: "Ontario", type: "Prospect", status: "培育中", currency: "USD", paymentTerm: "待确认", communicationLanguage: "English", primaryContactId: "", lastContactAt: "", preferences: [], kind: "company", aliases: [], domains: ["prospect.example.com"], lifecycle: "prospect", recordStatus: "canonical", revision: 1 };
const mergedSource: Account = { ...canonicalAccounts[0], id: "account-nas-duplicate", code: "NAS-DUP-DEMO", name: "NAS Demo Brand", aliases: [], domains: ["nas.example.com"], recordStatus: "merged", canonicalAccountId: "client-nas", revision: 2 };

const people: ContactPerson[] = [
  ...contacts.map(({ id, name, email, phone }) => ({ id, name, email, phone, status: "active" as const })),
  { id: "contact-nas-design", name: "Taylor Demo", email: "taylor@nas.example.com", status: "active" },
  { id: "contact-eyw-sourcing", name: "Jordan Demo", email: "jordan@eyw.example.com", status: "active" },
];
const affiliations: ContactAffiliation[] = [
  ...contacts.map((contact) => ({ id: `aff-${contact.id}`, contactId: contact.id, accountId: contact.clientId, officeId: contact.clientId === "client-nas" ? "office-nas-hk" : contact.clientId === "client-efc" ? "office-efc-hq" : "office-eyw-hq", jobTitle: contact.title, department: contact.department, functionTags: contact.department === "Design" ? ["design" as const] : contact.department === "Management" ? ["management" as const] : ["sourcing" as const] })),
  { id: "aff-nas-design", contactId: "contact-nas-design", accountId: "client-nas", officeId: "office-nas-ny", jobTitle: "Trim Designer", functionTags: ["design"] },
  { id: "aff-eyw-sourcing", contactId: "contact-eyw-sourcing", accountId: "client-eyw", officeId: "office-eyw-hq", jobTitle: "Sourcing Associate", functionTags: ["sourcing"] },
];

export const initialAccountState: AccountState = {
  actors,
  accounts: [...canonicalAccounts, prospect, mergedSource],
  offices: [
    { id: "office-nas-hk", accountId: "client-nas", officeName: { zh: "香港采购办公室", en: "Hong Kong Sourcing Office" }, functions: ["sourcing"], countryCode: "HK", city: "Hong Kong", isPrimary: true, status: "active" },
    { id: "office-nas-ny", accountId: "client-nas", officeName: { zh: "纽约设计办公室", en: "New York Design Office" }, functions: ["design"], countryCode: "US", city: "New York", isPrimary: false, status: "active" },
    { id: "office-efc-hq", accountId: "client-efc", officeName: { zh: "巴黎总部", en: "Paris HQ" }, functions: ["management", "sourcing"], countryCode: "FR", city: "Paris", isPrimary: true, status: "active" },
    { id: "office-eyw-hq", accountId: "client-eyw", officeName: { zh: "墨尔本总部", en: "Melbourne HQ" }, functions: ["design", "sourcing"], countryCode: "AU", city: "Melbourne", isPrimary: true, status: "active" },
    { id: "office-prospect-hq", accountId: "account-prospect", officeName: { zh: "多伦多办公室", en: "Toronto Office" }, functions: ["sourcing"], countryCode: "CA", city: "Toronto", isPrimary: true, status: "active" },
  ],
  groups: [{ id: "group-demo-fashion", name: "Demo Fashion Collective", description: { zh: "虚构品牌集团", en: "Fictional brand group" } }],
  discoveries: [
    { id: "discovery-nas", accountId: "client-nas", discoveredByActorId: "actor-sales-a", discoveredAt: "2026-04-10", sourceType: "trade_show", sourceDetail: { zh: "演示展会初次接触", en: "First contact at a demo trade show" }, recordedByActorId: "actor-sales-a", recordedAt: "2026-04-11" },
    { id: "discovery-nas-dup", accountId: "account-nas-duplicate", discoveredByActorId: "actor-sales-b", discoveredAt: "2026-05-02", sourceType: "market_research", sourceDetail: { zh: "独立市场调研发现同一品牌", en: "Independently found the same brand in research" }, recordedByActorId: "actor-sales-b", recordedAt: "2026-05-02" },
    { id: "discovery-efc", accountId: "client-efc", discoveredByActorId: "actor-sales-b", discoveredAt: "2026-03-01", sourceType: "website_inquiry", sourceDetail: { zh: "演示网站询盘", en: "Demo website inquiry" }, recordedByActorId: "actor-sales-b", recordedAt: "2026-03-02" },
    { id: "discovery-eyw", accountId: "client-eyw", discoveredByActorId: "actor-sales-c", discoveredAt: "2026-06-08", sourceType: "referral", sourceDetail: { zh: "演示联系人引荐", en: "Demo contact referral" }, recordedByActorId: "actor-sales-c", recordedAt: "2026-06-09" },
    { id: "discovery-prospect", accountId: "account-prospect", discoveredByActorId: "actor-sales-b", discoveredAt: "2026-07-20", sourceType: "market_research", sourceDetail: { zh: "待分配潜在客户", en: "Unassigned prospect" }, recordedByActorId: "actor-sales-b", recordedAt: "2026-07-20" },
  ],
  ownerships: [
    { id: "own-nas", scope: { accountId: "client-nas" }, ownerActorId: "actor-sales-a", startedAt: "2026-04-11" },
    { id: "own-nas-hk", scope: { accountId: "client-nas", officeId: "office-nas-hk" }, ownerActorId: "actor-sales-b", startedAt: "2026-06-01" },
    { id: "own-efc-old", scope: { accountId: "client-efc" }, ownerActorId: "actor-sales-b", startedAt: "2026-03-02", endedAt: "2026-06-15" },
    { id: "own-efc", scope: { accountId: "client-efc" }, ownerActorId: "actor-sales-a", startedAt: "2026-06-15" },
    { id: "own-eyw", scope: { accountId: "client-eyw" }, ownerActorId: "actor-sales-c", startedAt: "2026-06-09" },
  ],
  memberships: [
    { id: "team-nas-b", scope: { accountId: "client-nas" }, actorId: "actor-sales-b", functionTags: ["sales"], joinedAt: "2026-05-10" },
    { id: "team-efc-merch", scope: { accountId: "client-efc" }, actorId: "actor-merch-a", functionTags: ["merchandising"], joinedAt: "2026-07-01" },
    { id: "team-eyw-design", scope: { accountId: "client-eyw" }, actorId: "actor-design-a", functionTags: ["design", "technical"], joinedAt: "2026-06-10" },
  ],
  requests: [{ id: "request-nas-b", scope: { accountId: "client-nas" }, requestedByActorId: "actor-sales-b", status: "accepted", reason: "Independent discovery of the same brand", resolvedByActorId: "actor-sales-a", resolvedAt: "2026-05-10" }],
  events: [
    { id: "event-nas-duplicate-confirmed", accountId: "client-nas", occurredAt: "2026-05-09", actorId: "actor-sales-a", type: "duplicate_confirmed", payload: { otherAccountId: "account-nas-duplicate", resolutionId: "resolution-nas" } },
    { id: "event-efc-transfer", accountId: "client-efc", occurredAt: "2026-06-15", actorId: "actor-sales-a", type: "ownership_transferred", payload: { scope: { accountId: "client-efc" }, fromActorId: "actor-sales-b", toActorId: "actor-sales-a" } },
    { id: "event-nas-merge", accountId: "client-nas", occurredAt: "2026-05-12", actorId: "actor-sales-a", type: "accounts_merged", payload: { sourceAccountId: "account-nas-duplicate", targetAccountId: "client-nas", mergeId: "merge-nas" } },
    { id: "event-nas-request", accountId: "client-nas", occurredAt: "2026-05-08", actorId: "actor-sales-b", type: "collaboration_requested", payload: { requestId: "request-nas-b", requestedByActorId: "actor-sales-b" } },
    { id: "event-nas-accepted", accountId: "client-nas", occurredAt: "2026-05-10", actorId: "actor-sales-a", type: "collaboration_accepted", payload: { requestId: "request-nas-b", requestedByActorId: "actor-sales-b" } },
  ],
  activities: [
    { id: "activity-nas-note", accountId: "client-nas", type: "shared_note", title: { zh: "团队共享备注", en: "Shared team note" }, detail: { zh: "香港采购办公室负责辅料规格确认。", en: "The Hong Kong sourcing office coordinates trim specifications." }, occurredAt: "2026-07-28", actorId: "actor-sales-b" },
    { id: "activity-efc-call", accountId: "client-efc", type: "call", title: { zh: "订单跟进电话", en: "Order follow-up call" }, detail: { zh: "模拟订单执行沟通。", en: "Synthetic order execution discussion." }, occurredAt: "2026-08-05", actorId: "actor-sales-a" },
  ],
  people,
  affiliations,
  projectRoles: [
    { projectId: 1, contactId: "contact-nas-olivia", roleTags: ["decision_maker"], source: "demo inquiry" },
    { projectId: 2, contactId: "contact-efc-camille", roleTags: ["daily_contact"], source: "demo project" },
    { projectId: 3, contactId: "contact-eyw-noah", roleTags: ["technical_approver"], source: "demo project" },
  ],
  relationships: [
    { id: "relationship-nas", from: { kind: "actor", id: "actor-sales-b" }, to: { kind: "contact", id: "contact-nas-olivia" }, type: "knows", strength: "working", assessedByActorId: "actor-sales-b", assessedAt: "2026-07-20" },
    { id: "relationship-eyw", from: { kind: "contact", id: "contact-eyw-mia" }, to: { kind: "contact", id: "contact-eyw-noah" }, type: "works_with" },
  ],
  referrals: [
    { id: "referral-eyw", introducer: { kind: "contact", id: "contact-eyw-mia" }, introducedContactId: "contact-eyw-noah", recipient: { kind: "actor", id: "actor-sales-c" }, accountId: "client-eyw", projectId: 3, introducedAt: "2026-06-12", recordedByActorId: "actor-sales-c", recordedAt: "2026-06-12", sourceDetail: { zh: "创始人引荐材料开发联系人", en: "Founder introduced the material developer" } },
    { id: "referral-nas", introducer: { kind: "contact", id: "contact-nas-olivia" }, introducedContactId: "contact-nas-design", recipient: { kind: "actor", id: "actor-sales-b" }, accountId: "client-nas", projectId: 1, introducedAt: "2026-07-01", recordedByActorId: "actor-sales-b", recordedAt: "2026-07-01" },
  ],
  duplicateResolutions: [{ id: "resolution-nas", candidateAccountIds: ["account-nas-duplicate", "client-nas"], signals: ["alias", "hostname"], recordVersions: { "account-nas-duplicate": 1, "client-nas": 1 }, decision: "merge", reason: "Same demo brand and official hostname", resolvedByActorId: "actor-sales-a", resolvedAt: "2026-05-12" }],
  merges: [{ id: "merge-nas", sourceAccountIds: ["account-nas-duplicate"], targetAccountId: "client-nas", ownershipResolution: { ownerActorId: "actor-sales-a", reason: "Existing primary owner retained" }, fieldConflictSelections: {}, mergedByActorId: "actor-sales-a", mergedAt: "2026-05-12" }],
};

export const createAccountState = (): AccountState => structuredClone(initialAccountState);
