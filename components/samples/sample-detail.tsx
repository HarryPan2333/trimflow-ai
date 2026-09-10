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

type ModalKind = "feedback" | "revision" | "sent" | "approved" | null;

export function SampleDetail({ context, language, dispatch, onBack, onProject, onClient, showToast }: { context: SampleContext; language: InterfaceLanguage; dispatch: Dispatch<SampleAction>; onBack: () => void; onProject: () => void; onClient: () => void; showToast: (message: string) => void }) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const isEn = language === "English";
  const notify = (action: string) => { setModal(null); showToast(`${action} · Demo Workspace`); };
  const quotation = () => showToast(isEn ? "Quotation workflow will be completed in Step 6." : "报价流程将在 Step 6 完成；当前仅演示样品交接。 ");
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
  const submitFeedback = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); dispatch({ type: "feedback", feedback: makeFeedback(new FormData(event.currentTarget)) }); notify(isEn ? "Feedback added" : "客户反馈已添加"); };
  const submitRevision = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const specifications = Object.fromEntries(rows.map((row) => { const value = String(form.get(`spec-${row.key}`)).trim(); return [row.key, { value, status: value ? String(form.get(`status-${row.key}`)) as SpecificationValue["status"] : "Pending" }]; })) as Record<string, SpecificationValue>;
    dispatch({ type: "revision", sampleId: context.sample.id, version: createRevision(context, specifications, String(form.get("reason")), String(form.get("note"))) });
    notify(isEn ? "Revision created; feedback remains open until resolved" : "新版本已创建；关联反馈仍保留待处理状态");
  };
  const submitSent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    dispatch({ type: "sent", sampleId: context.sample.id, date: String(form.get("date")), logistics: { versionId: context.current!.id, courier: String(form.get("courier")), trackingNumber: `DEMO-${String(form.get("tracking")).replace(/^DEMO-/, "")}`, expectedArrival: String(form.get("arrival")) || undefined, destination: String(form.get("destination")), receiver: String(form.get("receiver")) } });
    notify(isEn ? "Sample marked as sent" : "当前版本已标记寄出");
  };
  const primaryContact = context.contacts.find((contact) => contact.isPrimary)?.name ?? "Demo Contact";
  return <div className="sample-workspace sample-detail">
    <SampleHeader context={context} language={language} onBack={onBack} onProject={onProject} onClient={onClient} onAction={setModal} />
    <div className="sample-journey" aria-label="样品开发流程"><span>Customer Idea</span><i>→</i><span>Requirement</span><i>→</i><span>Sample Request</span><i>→</i><strong>Development / Version</strong><i>→</i><span>Feedback / Revision</span><i>→</i><span>Approval</span><i>→</i><span>Quotation</span></div>
    <div className="sample-detail-grid"><div className="sample-main-column">
      <Card className="sample-section sample-current-summary"><div><span>当前开发 / Current Development</span><h2>{context.current?.summary ?? "等待样品申请"}</h2><p>{openFeedback.length ? `${openFeedback.length} 条修改要求待处理。${context.current?.reasonForChange ?? ""}` : context.current?.reasonForChange ?? context.sample.nextAction}</p></div><div><span>最新版本 / Latest Version</span><strong>{context.current?.version}</strong><small>{getSampleStatus(context)}</small></div></Card>
      <SampleVersionHistory context={context} />
      <SampleVersionComparison context={context} />
      <SampleFeedbackPanel context={context} onAdd={() => setModal("feedback")} onResolve={setResolveId} onRevision={() => setModal("revision")} />
      <SampleSpecification context={context} />
      <DesignInOpportunity context={context} />
    </div><aside className="sample-side-column"><SampleNextAction context={context} /><SampleReadiness context={context} onQuotation={quotation} /><SampleBlockers context={context} /><SampleLogistics context={context} /><SampleCost context={context} /></aside></div>
    <p className="sample-demo-note">{isEn ? "Demo Workspace · Session changes reset when you refresh." : demoNotice}</p>

    {modal === "feedback" && <Modal title="添加客户反馈 / Add Feedback" onClose={() => setModal(null)}><form className="modal-form sample-modal-form" onSubmit={submitFeedback}>
      <div className="form-row"><label>版本 / Version<select name="version" defaultValue={context.current?.id}>{context.versions.map((version) => <option key={version.id} value={version.id}>{version.version}</option>)}</select></label><label>反馈日期 / Feedback Date<input name="date" type="date" required defaultValue={DEMO_DATE} min={context.sample.createdAt} /></label></div>
      <div className="form-row"><label>来源 / Source<select name="source"><option>Email</option><option>WhatsApp</option><option>Meeting</option></select></label><label>联系人 / Contact<input name="contact" required defaultValue={primaryContact} /></label></div>
      <div className="form-row"><label>类别 / Category<select name="category">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label} / {value}</option>)}</select></label><label>重要程度 / Severity<select name="severity" defaultValue="Important">{Object.entries(severityLabels).map(([value, label]) => <option key={value} value={value}>{label} / {value}</option>)}</select></label></div>
      <p className="sample-form-note">Blocking 阻止继续；Important 影响确认；Minor 仅作优化建议，不自动阻塞批准。</p>
      <label>反馈摘要 / Feedback<input name="summary" required placeholder="例如：拉片 Logo 位置需要调整" /></label><label>反馈详情 / Details<textarea name="details" rows={3} required /></label><label>所需行动 / Required Action<textarea name="action" rows={2} required /></label>
      <ModalActions onClose={() => setModal(null)} label="保存反馈 / Save Feedback" />
    </form></Modal>}

    {modal === "revision" && <Modal title="创建新版本 / Create Revision" onClose={() => setModal(null)}><form className="modal-form sample-modal-form" onSubmit={submitRevision}>
      <p className="sample-form-note">继承 {context.current?.version} 规格；只修改需要调整的字段。创建版本不会自动解决客户反馈。</p>
      {openFeedback.length > 0 && <div className="sample-revision-brief"><h3>Revision Requirements / 修改要求</h3>{openFeedback.map((feedback) => <p key={feedback.id}>• {feedback.requiredAction ?? feedback.summary}</p>)}</div>}
      <label>修改原因 / Reason for Change<textarea name="reason" required rows={2} defaultValue={openFeedback.map((feedback) => feedback.summary).join("；")} /></label>
      <details className="revision-spec-editor" open><summary>继承与调整规格 / Inherited Specification</summary><div className="revision-spec-fields">{rows.map((row) => <div key={row.key}><label>{row.label}<input name={`spec-${row.key}`} defaultValue={row.value} /></label><label className="spec-confirmation-label">确认状态<select name={`status-${row.key}`} aria-label={`${row.label} 确认状态`} defaultValue={row.status}><option value="Pending">待确认</option><option value="Confirmed">已确认</option><option value="Not Required">已确认不需要</option></select></label></div>)}</div></details>
      <label>内部说明 / Internal Note<textarea name="note" rows={2} /></label><ModalActions onClose={() => setModal(null)} label="创建新版本 / Create Revision" />
    </form></Modal>}

    {modal === "sent" && <Modal title="标记样品寄出 / Mark as Sent" onClose={() => setModal(null)}><form className="modal-form sample-modal-form" onSubmit={submitSent}>
      <p className="sample-form-note">仅更新 {context.current?.version} 的演示物流。单号统一加 DEMO 前缀。</p>
      <div className="form-row"><label>快递 / Courier<input name="courier" required defaultValue="Demo Express" /></label><label>演示单号 / Tracking Number<input name="tracking" required defaultValue={`${context.sample.id}-${context.current?.version}`} /></label></div>
      <div className="form-row"><label>寄出日期 / Sent Date<input name="date" type="date" required defaultValue={DEMO_DATE} min={context.current?.createdAt} /></label><label>预计到达 / Expected Arrival<input name="arrival" type="date" min={DEMO_DATE} /></label></div>
      <label>目的地 / Destination<input name="destination" required defaultValue={context.client ? `${context.client.region} · ${context.client.country}` : ""} /></label><label>收件人 / Receiver<input name="receiver" required defaultValue={primaryContact} /></label><ModalActions onClose={() => setModal(null)} label="确认寄出 / Confirm Sent" />
    </form></Modal>}

    {modal === "approved" && <Modal title="记录客户确认 / Mark as Approved" onClose={() => setModal(null)}><form className="modal-form sample-modal-form" onSubmit={(event) => { event.preventDefault(); dispatch({ type: "approved", sampleId: context.sample.id, feedback: makeFeedback(new FormData(event.currentTarget), true) }); notify("当前版本已记录客户确认"); }}>
      <p className="sample-form-note">此操作记录客户对 {context.current?.version} 的确认。规格或重要反馈未解决时不能批准。</p>
      <label>确认联系人 / Contact<input name="contact" required defaultValue={primaryContact} /></label><label>确认依据 / Approval Evidence<textarea name="details" required rows={3} placeholder="例如：客户邮件确认当前版本外观与功能。" /></label><ModalActions onClose={() => setModal(null)} label="记录确认 / Record Approval" />
    </form></Modal>}

    {resolveId && <Modal title="解决客户反馈 / Resolve Feedback" onClose={() => setResolveId(null)}><div className="modal-form sample-modal-form"><p>确认所需行动已完成，并将解决记录关联至当前 {context.current?.version}。客户最终批准仍需单独记录。</p><p className="sample-form-note">{context.feedback.find((feedback) => feedback.id === resolveId)?.requiredAction}</p><div className="modal-actions"><Button variant="ghost" onClick={() => setResolveId(null)}>取消</Button><Button onClick={() => { dispatch({ type: "resolve", feedbackId: resolveId, versionId: context.current!.id }); setResolveId(null); showToast("反馈已标记解决 · Demo Workspace"); }}>确认已解决</Button></div></div></Modal>}
  </div>;
}

function ModalActions({ onClose, label }: { onClose: () => void; label: string }) {
  return <div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose}>取消 / Cancel</Button><Button type="submit">{label}</Button></div>;
}
