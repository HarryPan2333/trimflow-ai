"use client";

import { useState } from "react";
import { useI18n } from "../providers/language-provider";
import { Button, Modal } from "../ui/primitives";
import type { Project, ProjectStage } from "../../lib/mock-data";
import { projectStages } from "../../lib/mock-data";
import type { AccountState, DuplicateCandidate, DuplicateResolution } from "../../lib/accounts/types";
import { findDuplicateCandidates } from "../../lib/accounts/duplicates";
import { getCanonicalAccounts } from "../../lib/accounts/selectors";
import type { ProspectInput } from "./account-center";
import { DuplicateReview, type AccountBusinessContext } from "./duplicate-review";

function allocateProjectId() { return Date.now(); }

export function NewProjectDialog({ accountState, business, onClose, onCreate, onResolve, onOpenAccount, onRequestCollaboration, showToast }: {
  accountState: AccountState; business: AccountBusinessContext; onClose: () => void;
  onCreate: (project: Project, prospect?: ProspectInput, keepSeparate?: { candidates: string[]; reason: string; signals: DuplicateResolution["signals"]; actorId: string }) => void;
  onResolve: (ids: string[], decision: DuplicateResolution["decision"], reason: string, signals: DuplicateResolution["signals"], proposedName?: string, actorId?: string) => void;
  onOpenAccount: (id: string, tab: "overview" | "contacts" | "ownership") => void;
  onRequestCollaboration: (id: string, actorId: string) => boolean;
  showToast: (message: string) => void;
}) {
  const { t, label, text } = useI18n();
  const [mode, setMode] = useState<"existing" | "prospect">("existing");
  const [candidates, setCandidates] = useState<DuplicateCandidate[] | null>(null);
  const [pending, setPending] = useState<FormData | null>(null);
  const [actorId, setActorId] = useState("actor-sales-b");
  const accounts = getCanonicalAccounts(accountState);
  const finish = (form: FormData, selectedId?: string, separateReason?: string) => {
    const id = Number(form.get("projectId"));
    const prospect: ProspectInput | undefined = selectedId ? undefined : { name: String(form.get("customer")), country: String(form.get("country")), region: String(form.get("region")), kind: "brand", domain: String(form.get("domain")) };
    const account = selectedId ? accounts.find((item) => item.id === selectedId) : undefined;
    const customer = account?.name ?? prospect?.name ?? "";
    const project: Project = { id, clientId: selectedId ?? `account-new-${id}`, code: `NEW-${String(id).slice(-4)}`, name: String(form.get("name")), customer, region: account?.region ?? prospect?.region ?? "", product: String(form.get("product")), stage: String(form.get("stage")) as ProjectStage, lifecycleStage: "inquiry", progress: "项目已创建，等待整理初始客户询盘", owner: String(form.get("owner")), ownerActorId: String(form.get("ownerActorId")), next: "梳理客户询盘并确认缺失信息", updated: "刚刚", lastUpdatedAt: new Date(id).toISOString(), quantity: String(form.get("quantity") || "待确认"), delivery: String(form.get("delivery") || "待确认"), health: "良好", contact: String(form.get("contact") || "待补充"), email: "待补充", initials: "NP", color: "#285c72", currentSummary: "新项目已创建，当前处于询盘整理阶段。", confirmedInformation: [customer], pendingInformation: ["客户需求与产品规格待整理"], risks: [], nextActions: ["梳理客户询盘并确认缺失信息"] };
    onCreate(project, prospect, separateReason && candidates ? { candidates: candidates.map((item) => item.accountId), reason: separateReason, signals: [...new Set(candidates.flatMap((item) => item.signals))], actorId } : undefined);
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("projectId", String(allocateProjectId()));
    if (mode === "existing") { const id = String(form.get("accountId")); if (!accounts.some((item) => item.id === id)) { showToast(t("account.selectAccount")); return; } finish(form, id); return; }
    const prospect = { name: String(form.get("customer")), aliases: [], domains: String(form.get("domain")) ? [String(form.get("domain"))] : [], country: String(form.get("country")), city: String(form.get("region")) };
    const found = findDuplicateCandidates(accountState, prospect);
    if (found.length) { setCandidates(found); setPending(form); return; }
    finish(form);
  };
  return <Modal title={t("newProject.title")} onClose={onClose}><div className="account-dialog-body">
    <div className="account-actions"><Button variant={mode === "existing" ? "primary" : "secondary"} onClick={() => { setMode("existing"); setCandidates(null); }}>{t("account.newProjectExisting")}</Button><Button variant={mode === "prospect" ? "primary" : "secondary"} onClick={() => { setMode("prospect"); setCandidates(null); }}>{t("account.newProjectProspect")}</Button></div>
    {!candidates && <form className="modal-form" onSubmit={submit}><div className="form-row"><label>{t("newProject.name")}<input name="name" required placeholder={t("newProject.namePlaceholder")} /></label>{mode === "existing" ? <label>{t("account.selectAccount")}<select name="accountId" required>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}</select></label> : <label>{t("account.name")}<input name="customer" required placeholder={t("newProject.customerPlaceholder")} /></label>}</div>
      {mode === "prospect" && <div className="form-row"><label>{t("account.country")}<input name="country" required placeholder="Canada" /></label><label>{t("account.regionCity")}<input name="region" required placeholder={t("newProject.regionPlaceholder")} /></label></div>}
      {mode === "prospect" && <label>{t("account.domain")}<input name="domain" placeholder="demo.example.com" /></label>}
      <div className="form-row"><label>{t("newProject.contact")}<input name="contact" placeholder={t("newProject.contactPlaceholder")} /></label><label>{t("newProject.productType")}<select name="product"><option value="防水尼龙拉链">{label("防水尼龙拉链")}</option><option value="金属纽扣">{label("金属纽扣")}</option><option value="绳扣与织带">{label("绳扣与织带")}</option></select></label></div>
      <div className="form-row"><label>{t("newProject.salesStage")}<select name="stage">{projectStages.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label><label>{t("account.projectOwner")}<select name="ownerActorId" onChange={(event) => { const name = accountState.actors.find((item) => item.id === event.target.value)?.displayName.zh ?? ""; const hidden = event.currentTarget.form?.elements.namedItem("owner") as HTMLInputElement | null; if (hidden) hidden.value = name; }}><option value="actor-sales-a">{text(accountState.actors[0].displayName)}</option><option value="actor-sales-b">{text(accountState.actors[1].displayName)}</option><option value="actor-sales-c">{text(accountState.actors[2].displayName)}</option></select><input type="hidden" name="owner" defaultValue={accountState.actors[0].displayName.zh} /></label></div>
      <div className="form-row"><label>{t("newProject.quantity")}<input name="quantity" placeholder={t("newProject.quantityPlaceholder")} /></label><label>{t("newProject.delivery")}<input name="delivery" type="date" /></label></div><label>{t("newProject.inquiry")}<textarea name="inquiry" rows={3} placeholder={t("newProject.inquiryPlaceholder")} /></label><label>{t("newProject.notes")}<textarea name="notes" rows={2} placeholder={t("newProject.notesPlaceholder")} /></label><div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose}>{t("common.cancel")}</Button><Button type="submit">{t("actions.createProject")}</Button></div>
    </form>}
    {candidates && pending && <><label>{t("account.currentActor")}<select value={actorId} onChange={(event) => setActorId(event.target.value)}>{accountState.actors.filter((item) => item.functionTags.includes("sales")).map((item) => <option key={item.id} value={item.id}>{text(item.displayName)}</option>)}</select></label><DuplicateReview state={accountState} candidates={candidates} business={business} actorId={actorId} onUseExisting={(accountId) => { onResolve([accountId], "use_existing", "Used existing account from project creation", candidates.find((item) => item.accountId === accountId)?.signals ?? [], String(pending.get("customer")), actorId); finish(pending, accountId); }} onKeepSeparate={(reason) => finish(pending, undefined, reason)} onRequestCollaboration={(id) => { if (onRequestCollaboration(id, actorId)) onResolve([id], "request_collaboration", "Requested account collaboration from project creation", candidates.find((item) => item.accountId === id)?.signals ?? [], String(pending.get("customer")), actorId); }} onOpenAction={(id, tab) => { onClose(); onOpenAccount(id, tab); }} /></>}
  </div></Modal>;
}
