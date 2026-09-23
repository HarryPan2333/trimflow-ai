import type { Client, Contact } from "../mock-data/types";
import type { LocalizedText } from "../i18n";

export type Actor = { id: string; displayName: LocalizedText; functionTags: TeamFunction[]; active: boolean };
export type TeamFunction = "sales" | "merchandising" | "design" | "technical" | "support";
export type AccountLifecycle = "prospect" | "active" | "dormant" | "disqualified";
export type Account = Client & { workspaceId: "demo"; kind: "brand" | "company"; aliases: string[]; domains: string[]; lifecycle: AccountLifecycle; recordStatus: "canonical" | "merged"; canonicalAccountId?: string; groupId?: string; revision: number };
export type AccountOffice = { id: string; accountId: string; officeName: LocalizedText; functions: string[]; countryCode: string; city: string; regionCode?: string; isPrimary: boolean; status: "active" | "closed" };
export type BrandGroup = { id: string; name: string; description: LocalizedText };
export type AccountDiscovery = { id: string; accountId: string; discoveredByActorId: string; discoveredAt: string; sourceType: "trade_show" | "referral" | "website_inquiry" | "existing_network" | "market_research" | "customer_introduction" | "other"; sourceDetail: LocalizedText; recordedByActorId: string; recordedAt: string; contactId?: string; referralId?: string; projectId?: number };
export type OwnershipScope = { accountId: string; officeId?: string };
export type OwnershipAssignment = { id: string; scope: OwnershipScope; ownerActorId: string; startedAt: string; endedAt?: string; assignmentReason?: LocalizedText; startEventId?: string; endEventId?: string };
export type AccountTeamMembership = { id: string; scope: OwnershipScope; actorId: string; functionTags: TeamFunction[]; joinedAt: string; endedAt?: string };
export type CollaborationRequest = { id: string; scope: OwnershipScope; requestedByActorId: string; status: "pending" | "accepted" | "rejected" | "cancelled"; reason: string | LocalizedText; resolvedByActorId?: string; resolvedAt?: string };
type EventBase = { id: string; accountId: string; occurredAt: string; actorId: string };
export type AccountEvent = EventBase & (
  | { type: "discovery_recorded"; payload: { discoveryId: string } }
  | { type: "ownership_claimed" | "ownership_released"; payload: { scope: OwnershipScope; ownerActorId: string } }
  | { type: "ownership_transferred"; payload: { scope: OwnershipScope; fromActorId: string; toActorId: string } }
  | { type: "collaboration_requested" | "collaboration_accepted" | "collaboration_rejected"; payload: { requestId: string; requestedByActorId: string } }
  | { type: "team_member_added" | "team_member_removed"; payload: { membershipId: string; memberActorId: string } }
  | { type: "duplicate_confirmed" | "separate_account_confirmed"; payload: { otherAccountId: string; resolutionId: string } }
  | { type: "accounts_merged"; payload: { sourceAccountId: string; targetAccountId: string; mergeId: string } }
  | { type: "referral_recorded"; payload: { referralId: string } }
);
export type AccountActivity = { id: string; accountId: string; officeId?: string; projectId?: number; type: "meeting" | "call" | "follow_up" | "shared_note" | "customer_update"; title: LocalizedText; detail: LocalizedText; occurredAt: string; actorId: string };
export type ContactPerson = Pick<Contact, "id" | "name"> & { email?: string; phone?: string; status: "active" | "inactive" };
export type ContactAffiliation = { id: string; contactId: string; accountId: string; officeId?: string; jobTitle: string; department?: string; functionTags: Array<"procurement" | "sourcing" | "material_development" | "design" | "product_development" | "sustainability" | "technical" | "management">; startedAt?: string; endedAt?: string };
export type ProjectContactRole = { projectId: number; contactId: string; roleTags: Array<"decision_maker" | "influencer" | "technical_approver" | "daily_contact">; source: string };
export type PersonEndpoint = { kind: "actor" | "contact"; id: string };
export type PersonRelationship = { id: string; from: PersonEndpoint; to: PersonEndpoint; type: "knows" | "works_with" | "reports_to" | "influences"; strength?: "unknown" | "weak" | "working" | "strong"; assessedByActorId?: string; assessedAt?: string; note?: LocalizedText };
export type ReferralRecord = { id: string; introducer: PersonEndpoint; introducedContactId: string; recipient: PersonEndpoint; accountId: string; projectId?: number; introducedAt: string; recordedByActorId: string; recordedAt: string; sourceDetail?: LocalizedText };
export type DuplicateSignal = "name" | "alias" | "hostname" | "country" | "city" | "group";
export type DuplicateCandidate = { accountId: string; confidence: "high" | "review" | "weak"; signals: DuplicateSignal[]; reasons: LocalizedText[] };
export type DuplicateResolution = { id: string; candidateAccountIds: string[]; proposedName?: string; signals: DuplicateSignal[]; recordVersions: Record<string, number>; decision: "use_existing" | "request_collaboration" | "add_office" | "merge" | "keep_separate"; reason: string; resolvedByActorId: string; resolvedAt: string };
export type AccountMergeRecord = { id: string; sourceAccountIds: string[]; targetAccountId: string; ownershipResolution: { ownerActorId?: string; reason: string }; fieldConflictSelections: Record<string, string>; mergedByActorId: string; mergedAt: string };
export type AccountTimelineItem = { id: string; accountId: string; occurredAt: string; type: string; title: LocalizedText; detail?: LocalizedText; source: "event" | "activity" | "discovery" | "referral" | "project" };
export type AccountState = { actors: Actor[]; accounts: Account[]; offices: AccountOffice[]; groups: BrandGroup[]; discoveries: AccountDiscovery[]; ownerships: OwnershipAssignment[]; memberships: AccountTeamMembership[]; requests: CollaborationRequest[]; events: AccountEvent[]; activities: AccountActivity[]; people: ContactPerson[]; affiliations: ContactAffiliation[]; projectRoles: ProjectContactRole[]; relationships: PersonRelationship[]; referrals: ReferralRecord[]; duplicateResolutions: DuplicateResolution[]; merges: AccountMergeRecord[] };
