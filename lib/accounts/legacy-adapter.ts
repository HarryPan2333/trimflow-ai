import { contacts as legacyContacts } from "../mock-data";
import type { Client, Contact } from "../mock-data";
import type { AccountState } from "./types";
import { getAccountSourceIds, resolveCanonicalAccountId } from "./selectors";

export function getLegacyClients(state: AccountState): Client[] {
  return state.accounts.filter((item) => item.recordStatus === "canonical").map((item) => ({ id: item.id, code: item.code, name: item.name, country: item.country, region: item.region, type: item.type, status: item.status, currency: item.currency, paymentTerm: item.paymentTerm, communicationLanguage: item.communicationLanguage, primaryContactId: item.primaryContactId, lastContactAt: item.lastContactAt, preferences: item.preferences }));
}

export function getLegacyClient(state: AccountState, id: string): Client | undefined {
  const canonical = resolveCanonicalAccountId(state, id);
  return getLegacyClients(state).find((item) => item.id === canonical);
}

export function getLegacyContacts(state: AccountState, accountId: string): Contact[] {
  const sources = new Set(getAccountSourceIds(state, accountId));
  const existing = legacyContacts.filter((item) => sources.has(item.clientId));
  const added = state.affiliations.filter((item) => sources.has(item.accountId) && !existing.some((contact) => contact.id === item.contactId)).map((affiliation) => {
    const person = state.people.find((item) => item.id === affiliation.contactId)!;
    return { id: person.id, clientId: accountId, name: person.name, title: affiliation.jobTitle, email: person.email ?? "", phone: person.phone, isPrimary: false } satisfies Contact;
  });
  return [...existing, ...added];
}
