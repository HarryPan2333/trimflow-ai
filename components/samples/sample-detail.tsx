"use client";

import { useState } from "react";
import type { Dispatch, FormEvent } from "react";
import { Button, Card, Modal } from "../ui/primitives";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import type { SampleFeedback, SampleSpecification as SpecificationValue } from "../../lib/mock-data";
import { SampleHeader } from "./sample-header";
import { SampleSpecification } from "./sample-specification";
import { SampleVersionComparison, SampleVersionHistory } from "./sample-version-history";
import { SampleFeedbackPanel } from "./sample-feedback";
import { SampleBlockers, SampleNextAction, SampleReadiness } from "./sample-insights";
import { DesignInOpportunity, SampleCost, SampleLogistics } from "./sample-resources";
import { categoryLabels, createRevision, DEMO_DATE, demoNotice, getOpenRevisionFeedback, getSampleStatus, getSpecificationRows, severityLabels } from "./sample-data";
import type { SampleAction, SampleContext } from "./sample-data";
import { useI18n } from "../providers/language-provider";
import type { Issue } from "../../lib/issues/types";
import { IssueBridge } from "../issues/issue-bridge";

type ModalKind = "feedback" | "revision" | "sent" | "approved" | null;

export function SampleDetail({ context, language, dispatch, onBack, onProject, onClient, onCreateQuotation, issues, onOpenIssue, onCreateIssue, showToast }: { context: SampleContext; language: InterfaceLanguage; dispatch: Dispatch<SampleAction>; onBack: () => void; onProject: () => void; onClient: () => void; onCreateQuotation: () => void; issues: Issue[]; onOpenIssue: (id: string) => void; onCreateIssue: () => void; showToast: (message: string) => void }) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const { t, label, text } = useI18n();
  const notify = (action: string) => { setModal(null); showToast(`${action} · Demo Workspace`); };
  const openFeedback = getOpenRevisionFeedback(context);
  const rows = getSpecificationRows(context);
  const makeFeedback = (form: FormData, approved = false): SampleFeedback => ({
    id: `fb-demo-${crypto.randomUUID()}`, sampleId: context.sample.id, projectId: context.sample.projectId,
    sampleVersionId: String(form.get("version") || context.current?.id), receivedAt: String(form.get("date") || DEMO_DATE),
    author: String(form.get("contact")), channel: String(form.get("source") || "Email") as SampleFeedback["channel"],
    summary: approved ? `${context.current?.version} 客户确认` : String(form.get("summary")),
    details: String(form.get("details")), requiresRevision: !approved && form.get("severity") !== "Minor",
    category: approved ? "Quality" : String(form.get("category")) as SampleFeedback["category"],
    severity: approved ? "Minor" : String(form.get("severity")) as SampleFeedback["severity"],
    requiredAction: approved ? "归档确认样并交接报价。" : String(form.get("action")),
    resolution: approved ? "Resolved" : "Open",
  });
  const submitFeedback = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); dispatch({ type: "feedback", feedback: makeFeedback(new FormData(event.currentTarget)) }); notify(t("sample.feedbackAdded")); };
  const submitRevision = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const specifications = Object.fromEntries(rows.map((row) => { const value = String(form.get(`spec-${row.key}`)).trim(); return [row.key, { value, status: value ? String(form.get(`status-${row.key}`)) as SpecificationValue["status"] : "Pending" }]; })) as Record<string, SpecificationValue>;
    dispatch({ type: "revision", sampleId: context.sample.id, version: createRevision(context, specifications, String(form.get("reason")), String(form.get("note"))) });
    notify(t("sample.revisionCreated"));
  };
  const submitSent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    dispatch({ type: "sent", sampleId: context.sample.id, date: String(form.get("date")), logistics: { versionId: context.current!.id, courier: String(form.get("courier")), trackingNumber: `DEMO-${String(form.get("tracking")).replace(/^DEMO-/, "")}`, expectedArrival: String(form.get("arrival")) || undefined, destination: String(form.get("destination")), receiver: String(form.get("receiver")) } });
    notify(t("sample.sentSuccess"));
  };
  const primaryContact = context.contacts.find((contact) => contact.isPrimary)?.name ?? "Demo Contact";
  return <div className="sample-workspace sample-detail">
    <SampleHeader context={context} language={language} onBack={onBack} onProject={onProject} onClient={onClient} onAction={setModal} />
    <IssueBridge scope="sample" issues={issues} onOpen={onOpenIssue} onCreate={onCreateIssue} />
    <div className="sample-journey" aria-label={t("sample.flowLabel")}><span>{t("sample.journey.idea")}</span><i>→</i><span>{t("sample.journey.requirement")}</span><i>→</i><span>{t("sample.journey.request")}</span><i>→</i><strong>{t("sample.journey.development")}</strong><i>→</i><span>{t("sample.journey.feedback")}</span><i>→</i><span>{t("sample.journey.approval")}</span><i>→</i><span>{t("quotation.table.id")}</span></div>
    <div className="sample-detail-grid"><div className="sample-main-column">
      <Card className="sample-section sample-current-summary"><div><span>{t("sample.currentDevelopment")}</span><h2>{text(context.current?.summary ?? t("sample.currentWaiting"))}</h2><p>{openFeedback.length ? `${t("sample.revisionPending", { count: openFeedback.length })} ${text(context.current?.reasonForChange ?? "")}` : text(context.current?.reasonForChange ?? context.sample.nextAction)}</p></div><div><span>{t("sample.latestVersion")}</span><strong>{context.current?.version}</strong><small>{label(getSampleStatus(context))}</small></div></Card>
      <SampleVersionHistory context={context} />
      <SampleVersionComparison context={context} />
      <SampleFeedbackPanel context={context} onAdd={() => setModal("feedback")} onResolve={setResolveId} onRevision={() => setModal("revision")} />
      <SampleSpecification context={context} />
      <DesignInOpportunity context={context} />
    </div><aside className="sample-side-column"><SampleNextAction context={context} /><SampleReadiness context={context} onQuotation={onCreateQuotation} /><SampleBlockers context={context} /><SampleLogistics context={context} /><SampleCost context={context} /></aside></div>
    <p className="sample-demo-note">{language === "en" ? t("sample.sessionNotice") : demoNotice}</p>

    {modal === "feedback" && <Modal title={t("sample.addFeedback")} onClose={() => setModal(null)}><form className="modal-form sample-modal-form" onSubmit={submitFeedback}>
      <div className="form-row"><label>{t("common.version")}<select name="version" defaultValue={context.current?.id}>{context.versions.map((version) => <option key={version.id} value={version.id}>{version.version}</option>)}</select></label><label>{t("sample.feedbackDate")}<input name="date" type="date" required defaultValue={DEMO_DATE} min={context.sample.createdAt} /></label></div>
      <div className="form-row"><label>{t("common.source")}<select name="source"><option>Email</option><option>WhatsApp</option><option>Meeting</option></select></label><label>{t("common.contact")}<input name="contact" required defaultValue={primaryContact} /></label></div>
      <div className="form-row"><label>{t("common.category")}<select name="category">{Object.keys(categoryLabels).map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label><label>{t("sample.severity")}<select name="severity" defaultValue="Important">{Object.keys(severityLabels).map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label></div>
      <p className="sample-form-note">{t("sample.feedbackSeverityHelp")}</p>
      <label>{t("sample.feedbackSummary")}<input name="summary" required placeholder={t("sample.feedbackPlaceholder")} /></label><label>{t("sample.feedbackDetails")}<textarea name="details" rows={3} required /></label><label>{t("sample.requiredAction")}<textarea name="action" rows={2} required /></label>
      <ModalActions onClose={() => setModal(null)} label={t("common.save")} />
    </form></Modal>}

    {modal === "revision" && <Modal title={t("sample.createRevision")} onClose={() => setModal(null)}><form className="modal-form sample-modal-form" onSubmit={submitRevision}>
      <p className="sample-form-note">{t("sample.inheritHelp", { version: context.current?.version ?? "—" })}</p>
      {openFeedback.length > 0 && <div className="sample-revision-brief"><h3>{t("sample.revisionRequirements")}</h3>{openFeedback.map((feedback) => <p key={feedback.id}>• {text(feedback.requiredAction ?? feedback.summary)}</p>)}</div>}
      <label>{t("sample.reasonForChange")}<textarea name="reason" required rows={2} defaultValue={openFeedback.map((feedback) => feedback.summary).join("；")} /></label>
      <details className="revision-spec-editor" open><summary>{t("sample.inheritedSpecification")}</summary><div className="revision-spec-fields">{rows.map((row) => <div key={row.key}><label>{label(row.label)}<input name={`spec-${row.key}`} defaultValue={row.value} /></label><label className="spec-confirmation-label">{t("sample.confirmationStatus")}<select name={`status-${row.key}`} aria-label={`${label(row.label)} ${t("sample.confirmationStatus")}`} defaultValue={row.status}><option value="Pending">{label("Pending")}</option><option value="Confirmed">{label("Confirmed")}</option><option value="Not Required">{label("Not Required")}</option></select></label></div>)}</div></details>
      <label>{t("sample.internalNote")}<textarea name="note" rows={2} /></label><ModalActions onClose={() => setModal(null)} label={t("sample.createRevision")} />
    </form></Modal>}

    {modal === "sent" && <Modal title={t("sample.markSent")} onClose={() => setModal(null)}><form className="modal-form sample-modal-form" onSubmit={submitSent}>
      <p className="sample-form-note">{t("sample.sentHelp", { version: context.current?.version ?? "—" })}</p>
      <div className="form-row"><label>{t("common.courier")}<input name="courier" required defaultValue="Demo Express" /></label><label>{t("sample.trackingNumber")}<input name="tracking" required defaultValue={`${context.sample.id}-${context.current?.version}`} /></label></div>
      <div className="form-row"><label>{t("sample.sentDate")}<input name="date" type="date" required defaultValue={DEMO_DATE} min={context.current?.createdAt} /></label><label>{t("sample.expectedArrival")}<input name="arrival" type="date" min={DEMO_DATE} /></label></div>
      <label>{t("common.destination")}<input name="destination" required defaultValue={context.client ? `${context.client.region} · ${context.client.country}` : ""} /></label><label>{t("common.receiver")}<input name="receiver" required defaultValue={primaryContact} /></label><ModalActions onClose={() => setModal(null)} label={t("sample.confirmSent")} />
    </form></Modal>}

    {modal === "approved" && <Modal title={t("sample.markApproved")} onClose={() => setModal(null)}><form className="modal-form sample-modal-form" onSubmit={(event) => { event.preventDefault(); dispatch({ type: "approved", sampleId: context.sample.id, feedback: makeFeedback(new FormData(event.currentTarget), true) }); notify(t("sample.approvedSuccess")); }}>
      <p className="sample-form-note">{t("sample.approvalHelp", { version: context.current?.version ?? "—" })}</p>
      <label>{t("common.contact")}<input name="contact" required defaultValue={primaryContact} /></label><label>{t("sample.approvalEvidence")}<textarea name="details" required rows={3} placeholder={t("sample.approvalPlaceholder")} /></label><ModalActions onClose={() => setModal(null)} label={t("actions.recordApproval")} />
    </form></Modal>}

    {resolveId && <Modal title={t("sample.resolveFeedback")} onClose={() => setResolveId(null)}><div className="modal-form sample-modal-form"><p>{t("sample.resolveHelp", { version: context.current?.version ?? "—" })}</p><p className="sample-form-note">{text(context.feedback.find((feedback) => feedback.id === resolveId)?.requiredAction ?? "")}</p><div className="modal-actions"><Button variant="ghost" onClick={() => setResolveId(null)}>{t("common.cancel")}</Button><Button onClick={() => { dispatch({ type: "resolve", feedbackId: resolveId, versionId: context.current!.id }); setResolveId(null); showToast(t("sample.resolvedSuccess")); }}>{t("actions.confirmResolved")}</Button></div></div></Modal>}
  </div>;
}

function ModalActions({ onClose, label }: { onClose: () => void; label: string }) {
  const { t } = useI18n();
  return <div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose}>{t("common.cancel")}</Button><Button type="submit">{label}</Button></div>;
}
