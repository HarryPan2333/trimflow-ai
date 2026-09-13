"use client";

import { type Dispatch, type FormEvent, useState } from "react";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import { StatusBadge } from "../business/status-badge";
import { Badge, Button, Modal } from "../ui/primitives";
import type { QuotationAction, QuotationContext } from "./quotation-data";
import { createRevision, effectiveStatus, formatMoney, getNegotiationHealth } from "./quotation-data";
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

export function QuotationDetail({ context, language, dispatch, onBack, onProject, onSample, onOpenVersion, onCreatePO, showToast }: {
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
  const health = getNegotiationHealth(quote);
  const isEn = language === "English";
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
    showToast(isEn ? `Quotation marked ${status}` : `报价已更新为 ${status}`);
  };
  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    dispatch({ type: "update", id: quote.id, changes: { unitPrice: Number(form.get("unitPrice")), moq: Number(form.get("moq")), leadTime: String(form.get("leadTime")), validUntil: String(form.get("validUntil")), nextAction: String(form.get("nextAction")) } });
    setModal(null);
    showToast("草稿已更新 · Demo Workspace");
  };
  const submitRevision = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const revision = createRevision(context, { unitPrice: Number(form.get("unitPrice")), moq: Number(form.get("moq")), leadTime: String(form.get("leadTime")), validUntil: String(form.get("validUntil")), reason: String(form.get("reason")) });
    dispatch({ type: "create", ...revision });
    setModal(null);
    onOpenVersion(revision.quotation.id);
    showToast(`${revision.quotation.version} 报价版本已创建 · Demo Workspace`);
  };

  return <div className="quotation-workspace quote-detail">
    <button className="back-link" onClick={onBack}>‹ 返回报价中心 / Back to Quotations</button>
    <header className="quote-header">
      <div className="quote-header-main">
        <span className="eyebrow">QUOTATION COMMAND RECORD</span>
        <div className="quote-title-row"><h1>{quote.id}</h1><StatusBadge status={effectiveStatus(quote)} /><Badge tone={health.level === "high" ? "red" : health.level === "medium" ? "amber" : "green"}>{health.label}</Badge></div>
        <p>{context.client?.name} · <button onClick={onProject}>{context.project?.code} / {context.project?.name}</button> · {quote.product}</p>
        <div className="quote-reference-links"><button onClick={onProject}>Project →</button>{quote.approvedSampleId && <button onClick={() => onSample(quote.approvedSampleId!)}>Approved Sample {quote.approvedSampleId} →</button>}</div>
      </div>
      <div className="quote-header-actions">
        {quote.status === "Draft" && <Button variant="secondary" onClick={() => setModal("edit")}>编辑草稿 / Edit</Button>}
        {!["Accepted", "Rejected"].includes(quote.status) && <Button variant="secondary" onClick={() => setModal("revision")}>创建版本 / New Revision</Button>}
        {["Draft", "Internal Review"].includes(quote.status) && <Button onClick={() => updateStatus("Sent")}>标记已发送 / Mark Sent</Button>}
        {["Sent", "Negotiating"].includes(quote.status) && <><Button variant="secondary" onClick={() => updateStatus("Rejected")}>拒绝 / Reject</Button><Button onClick={() => updateStatus("Accepted")}>接受 / Accept</Button></>}
        {effectiveStatus(quote) === "Accepted" && <Button onClick={onCreatePO}>创建 PO / Create PO</Button>}
      </div>
    </header>

    <div className="quote-summary-band">
      {[
        ["Client", context.client?.name ?? "匿名客户"], ["Product", quote.product], ["Version", quote.version],
        ["Owner", quote.owner ?? context.project?.owner ?? "待分配"], ["Created", quote.createdAt ?? quote.issuedAt], ["Valid Until", quote.validUntil || "待确认"],
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
    <p className="quote-prototype-note">Demo Workspace · 当前操作仅在本次会话生效，刷新后恢复模拟数据。价格、客户、报价与谈判内容均为虚构或脱敏数据。</p>

    {modal === "edit" && <Modal title="编辑报价草稿 / Edit Draft" onClose={() => setModal(null)}><QuoteForm quote={quote} submitLabel="保存草稿 / Save Draft" onSubmit={submitEdit} onClose={() => setModal(null)} /></Modal>}
    {modal === "revision" && <Modal title="创建报价版本 / Create Revision" onClose={() => setModal(null)}><QuoteForm quote={quote} revision submitLabel="创建版本 / Create Revision" onSubmit={submitRevision} onClose={() => setModal(null)} /></Modal>}
  </div>;
}

function QuoteForm({ quote, revision = false, submitLabel, onSubmit, onClose }: { quote: QuotationContext["quotation"]; revision?: boolean; submitLabel: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <form className="modal-form quote-modal-form" onSubmit={onSubmit}><p className="sample-form-note">仅记录明确的商务条件。不要填写内部成本、毛利或未经确认的客户要求。</p><div className="form-row"><label>单价 / Unit Price<input name="unitPrice" type="number" min="0" step="0.01" required defaultValue={quote.unitPrice || ""} /></label><label>起订量 / MOQ<input name="moq" type="number" min="0" step="1" required defaultValue={quote.moq || ""} /></label></div><div className="form-row"><label>交期 / Lead Time<input name="leadTime" required defaultValue={quote.leadTime} placeholder="例如：28 days" /></label><label>有效期 / Valid Until<input name="validUntil" type="date" required defaultValue={quote.validUntil} /></label></div>{revision ? <label>修改原因 / Reason for Revision<textarea name="reason" rows={3} required defaultValue={quote.clientFeedback} /></label> : <label>下一步行动 / Next Action<textarea name="nextAction" rows={2} required defaultValue={quote.nextAction} /></label>}<div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose}>取消 / Cancel</Button><Button type="submit">{submitLabel}</Button></div></form>;
}
