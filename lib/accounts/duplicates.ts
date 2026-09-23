import type { Account, AccountState, DuplicateCandidate, DuplicateSignal } from "./types";
import { getCanonicalAccounts } from "./selectors";

export function normalizeAccountName(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("en").replace(/[\p{P}\p{S}]/gu, " ").replace(/\s+/g, " ").trim();
}

function host(value: string) {
  try { return new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}

export function findDuplicateCandidates(state: AccountState, input: Pick<Account, "name" | "aliases" | "domains" | "country" | "groupId"> & { city?: string }, excludeId?: string): DuplicateCandidate[] {
  const normalized = normalizeAccountName(input.name);
  const aliases = input.aliases.map(normalizeAccountName);
  const hostnames = input.domains.map(host).filter(Boolean);
  return getCanonicalAccounts(state).filter((account) => account.id !== excludeId).map((account) => {
    const signals: DuplicateSignal[] = [];
    const names = [account.name, ...account.aliases].map(normalizeAccountName);
    if (normalized && normalizeAccountName(account.name) === normalized) signals.push("name");
    else if (names.includes(normalized) || aliases.some((alias) => names.includes(alias))) signals.push("alias");
    if (hostnames.some((item) => account.domains.map(host).includes(item))) signals.push("hostname");
    if (input.country && input.country.toLowerCase() === account.country.toLowerCase()) signals.push("country");
    if (input.city && state.offices.some((office) => office.accountId === account.id && office.city.toLowerCase() === input.city?.toLowerCase())) signals.push("city");
    if (input.groupId && input.groupId === account.groupId) signals.push("group");
    const identity = signals.some((signal) => ["name", "alias", "hostname"].includes(signal));
    const confidence: DuplicateCandidate["confidence"] = signals.includes("name") || signals.includes("hostname") ? "high" : identity ? "review" : "weak";
    const descriptions: Record<DuplicateSignal, { zh: string; en: string }> = { name: { zh: "客户名称一致", en: "Account name matches" }, alias: { zh: "与已确认别名一致", en: "Confirmed alias matches" }, hostname: { zh: "官方网站域名一致", en: "Official website hostname matches" }, country: { zh: "所在国家一致", en: "Country matches" }, city: { zh: "办公室城市一致", en: "Office city matches" }, group: { zh: "同属虚构品牌集团", en: "Same fictional brand group" } };
    return { accountId: account.id, confidence, signals, reasons: signals.map((signal) => descriptions[signal]) };
  }).filter((candidate) => candidate.signals.length > 0).sort((a, b) => ({ high: 0, review: 1, weak: 2 })[a.confidence] - ({ high: 0, review: 1, weak: 2 })[b.confidence]);
}
