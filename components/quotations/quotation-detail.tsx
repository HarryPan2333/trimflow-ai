"use client";

import { type Dispatch, type FormEvent, useState } from "react";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import { StatusBadge } from "../business/status-badge";
import { Badge, Button, Modal } from "../ui/primitives";
import type { QuotationAction, QuotationContext } from "./quotation-data";
import { createRevision, effectiveStatus, formatMoney, getNegotiationHealth } from "./quotation-data";
import { useI18n } from "../providers/language-provider";
import {
  CommercialLevers,
  CommercialSummary,
  GapMatrix,
  LineItems,
  NegotiationTimeline,
  PriceTiers,
  QuoteSidebar,
  Strategy,
  VersionHistory,
} from "./quotation-panels";

type ModalKind = "edit" | "revision" | null;

export function QuotationDetail({ context, dispatch, onBack, onProject, onSample, onOpenVersion, onCreatePO, showToast }: {
  context: QuotationContext;
  language: InterfaceLanguage;
  dispatch: Dispatch<QuotationAction>;
  onBack: () => void;
  onProject: () => void;
  onSample: (id: string) => void;
  onOpenVersion: (id: string) => void;
  onCreatePO: () => void;
  showToast: (message: string) => void;
}) {
  const [modal, setModal] = useState<ModalKind>(null);
  const quote = context.quotation;
  const { language: interfaceLanguage, t, label, text, formatDate } = useI18n();
  const health = getNegotiationHealth(quote, interfaceLanguage);
  const updateStatus = (status: "Sent" | "Accepted" | "Rejected") => {
    dispatch({
      type: "update",
      id: quote.id,
      changes: { status, lastActivityAt: new Date().toISOString().slice(0, 10), nextAction: status === "Accepted" ? "创建或核对 Purchase Order" : status === "Rejected" ? "记录原因并评估后续机会" : "跟进客户商务反馈" },
      record: {
        id: `NEG-${quote.id}-${status}`,
        quotationId: quote.id,
        projectId: quote.projectId,
        recordedAt: new Date().toISOString().slice(0, 10),
        direction: status === "Sent" ? "销售回复" : "客户反馈",
        summary: status === "Sent" ? `${quote.version} 已标记发送客户。` : `报价已标记为 ${status}。`,
        nextAction: status === "Accepted" ? "创建或核对 PO" : status === "Rejected" ? "记录客户原因" : "跟进客户反馈",
        actor: status === "Sent" ? `${quote.owner ?? "销售"} · Sales` : "客户决定 · Demo",
        type: status === "Sent" ? "Quote Sent" : "Commercial Confirmation",
        ourPosition: `${formatMoney(quote.unitPrice, quote.currency)} · MOQ ${quote.moq.toLocaleString("en-US")}`,
        customerPosition: status,
        note: "Demo Workspace · 会话内状态更新。",
        nextMove: status === "Accepted" ? "PO handoff" : "客户跟进",
      },
    });
    showToast(t("quotation.statusUpdated", { status: label(status) }));
  };
  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    dispatch({ type: "update", id: quote.id, changes: { unitPrice: Number(form.get("unitPrice")), moq: Number(form.get("moq")), leadTime: String(form.get("leadTime")), validUntil: String(form.get("validUntil")), nextAction: String(form.get("nextAction")) } });
    setModal(null);
    showToast(t("quotation.draftUpdated"));
  };
  const submitRevision = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const revision = createRevision(context, { unitPrice: Number(form.get("unitPrice")), moq: Number(form.get("moq")), leadTime: String(form.get("leadTime")), validUntil: String(form.get("validUntil")), reason: String(form.get("reason")) });
    dispatch({ type: "create", ...revision });
    setModal(null);
    onOpenVersion(revision.quotation.id);
    showToast(t("quotation.createRevisionSuccess", { version: revision.quotation.version }));
  };

  return <div className="quotation-workspace quote-detail">
    <button className="back-link" onClick={onBack}>‹ {t("quotation.back")}</button>
    <header className="quote-header">
      <div className="quote-header-main">
        <span className="eyebrow">{t("quotation.commandRecord")}</span>
        <div className="quote-title-row"><h1>{quote.id}</h1><StatusBadge status={effectiveStatus(quote)} /><Badge tone={health.level === "high" ? "red" : health.level === "medium" ? "amber" : "green"}>{health.label}</Badge></div>
        <p>{text(context.client?.name ?? t("order.anonymousClient"))} · <button onClick={onProject}>{context.project?.code} / {text(context.project?.name ?? "")}</button> · {text(quote.product)}</p>
        <div className="quote-reference-links"><button onClick={onProject}>{t("common.project")} →</button>{quote.approvedSampleId && <button onClick={() => onSample(quote.approvedSampleId!)}>{label("Approved")} {t("common.product")} {quote.approvedSampleId} →</button>}</div>
      </div>
      <div className="quote-header-actions">
        {quote.status === "Draft" && <Button variant="secondary" onClick={() => setModal("edit")}>{t("quotation.editDraft")}</Button>}
        {!["Accepted", "Rejected"].includes(quote.status) && <Button variant="secondary" onClick={() => setModal("revision")}>{t("quotation.newRevision")}</Button>}
        {["Draft", "Internal Review"].includes(quote.status) && <Button onClick={() => updateStatus("Sent")}>{t("quotation.markSent")}</Button>}
        {["Sent", "Negotiating"].includes(quote.status) && <><Button variant="secondary" onClick={() => updateStatus("Rejected")}>{t("quotation.reject")}</Button><Button onClick={() => updateStatus("Accepted")}>{t("quotation.accept")}</Button></>}
        {effectiveStatus(quote) === "Accepted" && <Button onClick={onCreatePO}>{t("quotation.createPO")}</Button>}
      </div>
    </header>

    <div className="quote-summary-band">
      {[
        [t("common.client"), text(context.client?.name ?? t("order.anonymousClient"))], [t("common.product"), text(quote.product)], [t("common.version"), quote.version],
        [t("common.owner"), text(quote.owner ?? context.project?.owner ?? t("common.notAssigned"))], [t("quotation.created"), formatDate(quote.createdAt ?? quote.issuedAt)], [t("common.validUntil"), quote.validUntil ? formatDate(quote.validUntil) : t("common.notConfirmed")],
      ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </div>

    <CommercialSummary context={context} />
    <div className="quote-detail-grid">
      <main className="quote-main-column">
        <LineItems context={context} />
        <PriceTiers context={context} />
        <GapMatrix context={context} />
        <NegotiationTimeline context={context} />
        <VersionHistory context={context} />
        <CommercialLevers context={context} />
        <Strategy context={context} />
      </main>
      <aside className="quote-side-column"><QuoteSidebar context={context} onCreatePO={onCreatePO} /></aside>
    </div>
    <p className="quote-prototype-note">{t("quotation.demoNotice")}</p>

    {modal === "edit" && <Modal title={t("quotation.editDraft")} onClose={() => setModal(null)}><QuoteForm quote={quote} submitLabel={t("quotation.saveDraft")} onSubmit={submitEdit} onClose={() => setModal(null)} /></Modal>}
    {modal === "revision" && <Modal title={t("quotation.newRevision")} onClose={() => setModal(null)}><QuoteForm quote={quote} revision submitLabel={t("quotation.newRevision")} onSubmit={submitRevision} onClose={() => setModal(null)} /></Modal>}
  </div>;
}

function QuoteForm({ quote, revision = false, submitLabel, onSubmit, onClose }: { quote: QuotationContext["quotation"]; revision?: boolean; submitLabel: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  const { t } = useI18n();
  return <form className="modal-form quote-modal-form" onSubmit={onSubmit}><p className="sample-form-note">{t("quotation.formHelp")}</p><div className="form-row"><label>{t("common.unitPrice")}<input name="unitPrice" type="number" min="0" step="0.01" required defaultValue={quote.unitPrice || ""} /></label><label>MOQ<input name="moq" type="number" min="0" step="1" required defaultValue={quote.moq || ""} /></label></div><div className="form-row"><label>{t("common.leadTime")}<input name="leadTime" required defaultValue={quote.leadTime} placeholder="28 days" /></label><label>{t("common.validUntil")}<input name="validUntil" type="date" required defaultValue={quote.validUntil} /></label></div>{revision ? <label>{t("quotation.reasonForRevision")}<textarea name="reason" rows={3} required defaultValue={quote.clientFeedback} /></label> : <label>{t("common.nextAction")}<textarea name="nextAction" rows={2} required defaultValue={quote.nextAction} /></label>}<div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose}>{t("common.cancel")}</Button><Button type="submit">{submitLabel}</Button></div></form>;
}
