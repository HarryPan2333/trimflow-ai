"use client";

import "../components/samples/sample-workspace.css";
import "../components/quotations/quotation-workspace.css";
import "../components/orders/order-workspace.css";
import "../components/products/product-workspace.css";
import "../components/theme/steep-editorial.css";
import "../components/accounts/account-workspace.css";
import "../components/deal-room/deal-room.css";
import "../components/reports/report-workspace.css";
import "../components/issues/issues-workspace.css";

import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { EmptyState } from "../components/business/empty-state";
import { AccountCenter, type ProspectInput } from "../components/accounts/account-center";
import { AccountWorkspace, type AccountTab } from "../components/accounts/account-workspace";
import { DealRoomWorkspace } from "../components/deal-room/deal-room-workspace";
import { ReportsCenter } from "../components/reports/reports-center";
import { IssuesWorkspace, type IssueIntent } from "../components/issues/issues-workspace";
import { createIssueWorkspace } from "../lib/issues/repository";
import { addIssueSuggestion } from "../lib/issues/commands";
import type { IssueWorkspace } from "../lib/issues/types";
import { TaskList } from "../components/tasks/task-list";
import { createTaskWorkspace, createWorkspaceTask, changeTaskStatus, type WorkspaceTask } from "../lib/tasks/workspace";
import { adaptSources, type BusinessSources } from "../lib/activity-memory/source-adapters";
import { emptyActivityMemory, reconcileMemory } from "../lib/activity-memory/projection";
import { addManualActivity } from "../lib/activity-memory/commands";
import type { ActivityMemoryItem, ManualActivityEntry } from "../lib/activity-memory/types";
import { createReportContext } from "../lib/reports/context";
import { DemoReportGenerator } from "../lib/reports/generator";
import { addReportHumanNote, editReportBlock, finalizeReport, generateReport, reviewReport } from "../lib/reports/commands";
import { emptyReportState, type AttributionMode, type ReportKind, type ReportLanguage } from "../lib/reports/types";
import { createReportPeriod, DEMO_REPORT_DATE, DEMO_REPORT_TIME_ZONE } from "../lib/reports/period";
import { selectMemory } from "../lib/activity-memory/selectors";
import { createDealRoomState } from "../lib/deal-room/repository";
import { createRoom } from "../lib/deal-room/commands";
import { applyReviewedProposal } from "../lib/deal-room/apply";
import { suggestRoomParticipants } from "../lib/deal-room/selectors";
import type { DealRoomState } from "../lib/deal-room/types";
import { NewProjectDialog } from "../components/accounts/new-project-dialog";
import { createAccountState } from "../lib/accounts/repository";
import { validateProjectAccountReference } from "../lib/accounts/validation";
import { addProspect, recordDuplicateResolution, requestCollaboration } from "../lib/accounts/commands";
import type { Account, AccountState, DuplicateResolution } from "../lib/accounts/types";
import { HealthBadge } from "../components/business/health-badge";
import { StatusBadge } from "../components/business/status-badge";
import { DashboardView } from "../components/dashboard/dashboard-view";
import { PageHeader } from "../components/layout/page-header";
import { WorkspaceShell, workspaceNavigation } from "../components/layout/workspace-shell";
import type { InterfaceLanguage, WorkspaceView } from "../components/layout/workspace-shell";
import type { GlobalCreateType } from "../components/layout/workspace-shell";
import { ProjectCommandCenter } from "../components/projects/project-command-center";
import { SampleCenter } from "../components/samples/sample-center";
import { SampleDetail } from "../components/samples/sample-detail";
import { createSampleWorkspace, getSampleContext, getSampleReadiness, sampleWorkspaceReducer } from "../components/samples/sample-data";
import type { SampleWorkspace } from "../components/samples/sample-data";
import { QuotationCenter } from "../components/quotations/quotation-center";
import { QuotationDetail } from "../components/quotations/quotation-detail";
import { createDraftFromSample, createQuotationWorkspace, getQuotationContext, quotationWorkspaceReducer } from "../components/quotations/quotation-data";
import type { QuotationWorkspace } from "../components/quotations/quotation-data";
import { OrderCenter } from "../components/orders/order-center";
import { OrderDetail } from "../components/orders/order-detail";
import { ProductLibrary } from "../components/products/product-library";
import { ProductDetail as ProductLibraryDetail } from "../components/products/product-detail";
import { AddProductToProjectDialog } from "../components/products/add-product-to-project-dialog";
import { mockProductLibraryRepository } from "../lib/product-library/repository";
import { addProductToProject } from "../lib/product-library/integration";
import { getProductById, getVariantsForProduct } from "../lib/product-library/selectors";
import type { ProductLibraryData } from "../lib/product-library/types";
import { createOrderFromQuote, createOrderWorkspace, getOrderContext, orderWorkspaceReducer } from "../components/orders/order-data";
import type { OrderWorkspace } from "../components/orders/order-data";
import { Badge, Button, Card } from "../components/ui/primitives";
import { useI18n } from "../components/providers/language-provider";
import {
  projects as initialProjects,
  projectStages as stages,
  communications as caseCommunications,
  timelineEvents as caseTimeline,
} from "../lib/mock-data";
import type { Project, ProjectStage as Stage, TimelineEvent } from "../lib/mock-data";
import type { LocalizedText } from "../lib/i18n";

type OutputLanguage = "中文" | "英文" | "中英对照";
type View = WorkspaceView | "detail" | "account-detail" | "product-detail" | "sample-detail" | "quotation-detail" | "order-detail" | "deal-room";

const placeholderViews = new Set<WorkspaceView>(["fulfillment"]);

const aiPrompts = [
  { prompt: "总结当前项目", key: "ai.prompt.summary" },
  { prompt: "还有哪些信息待确认？", key: "ai.prompt.open" },
  { prompt: "生成下一步行动", key: "ai.prompt.actions" },
  { prompt: "生成客户英文回复", key: "ai.prompt.reply" },
  { prompt: "生成内部中文任务单", key: "ai.prompt.task" },
  { prompt: "生成项目周报", key: "ai.prompt.report" },
  { prompt: "准备价格谈判方案", key: "ai.prompt.negotiate" },
  { prompt: "当前项目有哪些风险？", key: "ai.prompt.risks" },
] as const;

const aiContent: Record<string, { title: string; titleEn: string; zh: string; en: string }> = {
  总结当前项目: {
    title: "项目状态摘要",
    titleEn: "Project Status Summary",
    zh: "项目处于打样阶段。第二版防水拉链样品已于今日签收，客户将优先测试 64 cm 黑色款。主要规格已基本确认，但定制 Logo、目标价格及洗后防水测试标准仍待确认。整体进度正常，建议在 7 月 30 日前主动跟进测试安排。",
    en: "The project is in sampling. The second waterproof zipper sample set was received today, and the client will prioritize the 64 cm black version. Most specifications are confirmed, while the custom logo, target price and post-wash water-repellency standard remain open.",
  },
  "还有哪些信息待确认？": {
    title: "待确认信息清单",
    titleEn: "Unconfirmed Information",
    zh: "1. 拉片定制 Logo 的最终图稿与雕刻位置\n2. 客户可接受的目标价格区间\n3. AATCC 22 测试应以 3 次还是 5 次水洗为准\n4. 首批订单中各长度的数量比例\n5. 大货包装与条码要求",
    en: "1. Final custom logo artwork and engraving position\n2. Acceptable target price range\n3. Whether AATCC 22 applies after 3 or 5 wash cycles\n4. Quantity split by zipper length\n5. Bulk packaging and barcode requirements",
  },
  生成下一步行动: {
    title: "建议下一步行动",
    titleEn: "Recommended Next Actions",
    zh: "优先级 P1｜7 月 30 日前通过邮件确认客户的测试计划及反馈日期。\n优先级 P1｜请技术部书面说明水洗 3 次与 5 次后的性能差异。\n优先级 P2｜向客户索取 Logo 矢量文件及各长度的数量占比。\n优先级 P2｜按 80K / 120K / 200K 三档数量准备阶梯报价。",
    en: "P1 | Confirm the client's testing schedule and feedback date by July 30.\nP1 | Ask the technical team to document the performance difference after 3 vs. 5 washes.\nP2 | Request vector logo artwork and the quantity split by length.\nP2 | Prepare tiered pricing for 80K / 120K / 200K units.",
  },
  生成客户英文回复: {
    title: "客户英文回复草稿",
    titleEn: "Client Email Draft",
    zh: "Dear Olivia,\n\nThank you for confirming receipt of the V2 samples. We understand that your team will test the 64 cm black zipper first. Could you please share your expected testing schedule and confirm whether the water-repellency rating should be assessed after three or five wash cycles?\n\nOur technical team is ready to support you if any questions arise during testing.\n\nBest regards,\nChen",
    en: "Dear Olivia,\n\nThank you for confirming receipt of the V2 samples. We understand that your team will test the 64 cm black zipper first. Could you please share your expected testing schedule and confirm whether the water-repellency rating should be assessed after three or five wash cycles?\n\nOur technical team is ready to support you if any questions arise during testing.\n\nBest regards,\nChen",
  },
  生成内部中文任务单: {
    title: "内部跟进任务单",
    titleEn: "Internal Follow-up Tasks",
    zh: "项目：NAS-2407 防水拉链开发\n负责人：陈晨\n协作：技术部、报价组\n截止：2026-07-30\n\n• 技术部：确认 3/5 次水洗测试差异并提供数据\n• 报价组：准备 80K/120K/200K 阶梯报价\n• 销售：跟进客户测试日程、Logo 文件及数量占比",
    en: "Internal task sheet created for the sales, technical and quotation teams. Key deadline: July 30, 2026.",
  },
  生成项目周报: {
    title: "本周项目周报",
    titleEn: "Weekly Project Report",
    zh: "本周完成：完成 V2 样品制作，样品已寄达客户。\n客户反馈：将优先测试 64 cm 黑色样品。\n当前风险：双方对水洗次数的测试要求尚未统一。\n下周计划：取得初步测试反馈，确认 Logo 文件及目标价格，完成阶梯报价。",
    en: "Completed this week: V2 samples produced and delivered.\nClient feedback: The 64 cm black sample will be tested first.\nCurrent risk: Misalignment on post-wash test cycles.\nNext week: Obtain initial test feedback, confirm logo artwork and target price, and complete tiered pricing.",
  },
  准备价格谈判方案: {
    title: "价格谈判准备",
    titleEn: "Price Negotiation Preparation",
    zh: "建议守价区间：USD 0.86–0.91 / 条；目标成交价为 USD 0.88。\n可交换条件：年采购量达到 200K、采用统一规格包装、使用标准色且不另行调色。\n不宜轻易让步：定制模具费、专项测试费、低于 80K 的小单附加费。\n沟通策略：先确认年采购量、需求预测准确度及付款条件，再讨论降价幅度。",
    en: "Suggested range: USD 0.86–0.91 per piece; target close at USD 0.88. Trade concessions for 200K annual volume, standardized packaging and standard colors. Protect tooling, special testing and small-order surcharges.",
  },
  "当前项目有哪些风险？": {
    title: "项目风险扫描",
    titleEn: "Project Risk Scan",
    zh: "中风险｜测试标准存在冲突，可能需要重新打样，并造成 7–10 天延期。\n中风险｜目标价格尚未确认，测试通过后可能出现较大价差。\n低风险｜Logo 图稿尚未提供，目前不影响功能样测试。\n建议：本周内书面确认测试标准，并提前提供价格区间。",
    en: "Medium: Conflicting test standards may trigger resampling and a 7–10 day delay.\nMedium: The target price is still unconfirmed.\nLow: Logo artwork is pending but does not block functional testing.\nRecommendation: confirm the test standard in writing this week and share a preliminary price range.",
  },
};

const subscribeToLocation = () => () => undefined;
const readEmbeddedMode = () => new URLSearchParams(window.location.search).get("embedded") === "true";
const readServerEmbeddedMode = () => false;

function Projects({ projects, openProject, openNew }: { projects: Project[]; openProject: (p: Project) => void; openNew: () => void }) {
  const { t, label, text } = useI18n();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("全部阶段");
  const [product, setProduct] = useState("全部产品");
  const filtered = projects.filter((p) =>
    `${p.name}${p.customer}${p.code}`.toLowerCase().includes(search.toLowerCase()) &&
    (stage === "全部阶段" || p.stage === stage) &&
    (product === "全部产品" || p.product.includes(product))
  );
  return (
    <>
      <PageHeader title={t("projects.title")} subtitle={t("projects.subtitle")} actions={<Button onClick={openNew}>＋ {t("actions.createProject")}</Button>} />
      <Card className="filters">
        <label className="searchbox"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("projects.search")} /></label>
        <select value={stage} onChange={(e) => setStage(e.target.value)} aria-label={t("projects.stageFilter")}>
          <option value="全部阶段">{t("projects.allStages")}</option>{stages.map((x) => <option key={x} value={x}>{label(x)}</option>)}
        </select>
        <select value={product} onChange={(e) => setProduct(e.target.value)} aria-label={t("projects.productFilter")}>
          <option value="全部产品">{t("projects.allProducts")}</option><option value="拉链">{label("拉链")}</option><option value="纽扣">{label("纽扣")}</option><option value="绳扣">{label("绳扣")}</option><option value="织带">{label("织带")}</option>
        </select>
        <span className="filter-count">{t("projects.found", { count: filtered.length })}</span>
      </Card>
      <div className="project-grid">
        {filtered.map((p) => (
          <button className="project-card card" key={p.id} onClick={() => openProject(p)}>
            <div className="project-top">
              <span className="client-avatar large" style={{ background: p.color }}>{p.initials}</span>
              <div><span className="project-code">{p.code}</span><h3>{text(p.name)}</h3></div>
              <HealthBadge status={p.health} className="health" showDot={false} />
            </div>
            <div className="project-client"><span>{t("common.client")}</span><strong>{text(p.customer)}</strong><small>{text(p.region)}</small></div>
            <div className="project-tags"><StatusBadge status={p.stage} /><Badge>{text(p.product)}</Badge></div>
            <div className="project-progress"><span>{t("projects.latestProgress")}</span><p>{text(p.progress)}</p></div>
            <div className="next-action"><span>→</span><div><small>{t("common.nextAction")}</small><strong>{text(p.next)}</strong></div></div>
            <div className="project-footer"><span>{t("common.owner")} · {text(p.owner)}</span><span>{text(p.updated)}　›</span></div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <Card className="empty-state"><span>⌕</span><h3>{t("projects.noMatch")}</h3><p>{t("projects.noMatchHelp")}</p></Card>}
    </>
  );
}

function ProjectDetail({
  project,
  accountState,
  dealRoomState,
  sharedTasks,
  projectActivities,
  onAddProjectActivity,
  recentMemory,
  onOpenReports,
  onOpenDealRoom,
  onCreateDealRoom,
  onBack,
  updateStage,
  showToast,
  sampleWorkspace,
  quotationWorkspace,
  orderWorkspace,
  productLibrary,
  onBrowseProducts,
  onOpenProduct,
  onOpenSample,
  onOpenQuotation,
  onCreateQuotation,
  onOpenOrder,
  issues,
  onOpenIssue,
  onCreateIssue,
  language,
  initialTab,
}: {
  project: Project;
  accountState: AccountState;
  dealRoomState: DealRoomState;
  sharedTasks: WorkspaceTask[];
  projectActivities: TimelineEvent[];
  onAddProjectActivity: (event: TimelineEvent) => void;
  recentMemory: ActivityMemoryItem[];
  onOpenReports: () => void;
  onOpenDealRoom: (id: string) => void;
  onCreateDealRoom: (accountId: string, projectId?: number) => void;
  onBack: () => void;
  updateStage: (stage: Stage) => void;
  showToast: (s: string) => void;
  sampleWorkspace: SampleWorkspace;
  quotationWorkspace: QuotationWorkspace;
  orderWorkspace: OrderWorkspace;
  productLibrary: ProductLibraryData;
  onBrowseProducts: () => void;
  onOpenProduct: (id: string) => void;
  onOpenSample: (id: string) => void;
  onOpenQuotation: (id: string) => void;
  onCreateQuotation: () => void;
  onOpenOrder: (id: string) => void;
  issues: IssueWorkspace;
  onOpenIssue: (id: string) => void;
  onCreateIssue: () => void;
  language: InterfaceLanguage;
  initialTab: "overview" | "samples" | "quotations" | "orders";
}) {
  return (
    <ProjectCommandCenter
      key={project.id}
      project={project}
      accountState={accountState}
      dealRoomState={dealRoomState}
      sharedTasks={sharedTasks}
      projectActivities={projectActivities}
      onAddProjectActivity={onAddProjectActivity}
      recentMemory={recentMemory}
      onOpenReports={onOpenReports}
      onOpenDealRoom={onOpenDealRoom}
      onCreateDealRoom={onCreateDealRoom}
      stages={stages}
      onBack={onBack}
      onUpdateStage={updateStage}
      showToast={showToast}
      sampleWorkspace={sampleWorkspace}
      quotationWorkspace={quotationWorkspace}
      orderWorkspace={orderWorkspace}
      productLibrary={productLibrary}
      onBrowseProducts={onBrowseProducts}
      onOpenProduct={onOpenProduct}
      onOpenSample={onOpenSample}
      onOpenQuotation={onOpenQuotation}
      onCreateQuotation={onCreateQuotation}
      onOpenOrder={onOpenOrder}
      issues={issues}
      onOpenIssue={onOpenIssue}
      onCreateIssue={onCreateIssue}
      language={language}
      initialTab={initialTab}
      aiCopilot={<AIAssistant project={project} showToast={showToast} />}
    />
  );
}

type AssistantAnswer = {
  id: string;
  title: string;
  answer: string;
  mode: "live" | "mock";
  status: "confirmed" | "partially_confirmed" | "not_confirmed";
  evidence: string[];
};

function AIAssistant({ project, showToast }: { project: Project; showToast: (s: string) => void }) {
  const { t, label, text } = useI18n();
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("中文");
  const [answers, setAnswers] = useState<AssistantAnswer[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const initialAnswer: AssistantAnswer = {
    id: "initial",
    title: t("ai.materialTitle", { code: project.code }),
    answer: `${text(project.name)}\n${t("ai.initialStage", { value: label(project.stage) })}\n${t("ai.initialProgress", { value: text(project.progress) })}\n${t("ai.initialNext", { value: text(project.next) })}`,
    mode: "mock",
    status: "partially_confirmed",
    evidence: ["project_profile"],
  };
  const ask = async (prompt: string) => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setInput("");
    try {
      const response = await fetch("/api/project-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, question: prompt, language: outputLanguage }),
      });
      if (!response.ok) throw new Error("AI request failed");
      const result = (await response.json()) as {
        mode: "live" | "mock";
        data: Omit<AssistantAnswer, "id" | "mode">;
      };
      setAnswers((current) => [
        {
          ...result.data,
          id: `${Date.now()}`,
          mode: result.mode,
        },
        ...current,
      ]);
    } catch {
      const fallback = aiContent[prompt];
      const fallbackText = fallback
        ? outputLanguage === "中文"
          ? fallback.zh
          : outputLanguage === "英文"
            ? fallback.en
            : `${fallback.zh}\n\n— English —\n${fallback.en}`
        : outputLanguage === "英文"
          ? "This information has not yet been confirmed in the current project materials."
          : "当前项目材料中尚未确认";
      setAnswers((current) => [
        {
          id: `${Date.now()}`,
          title: fallback ? (outputLanguage === "英文" ? fallback.titleEn : fallback.title) : t("ai.notConfirmed"),
          answer: fallbackText,
          mode: "mock",
          status: fallback ? "partially_confirmed" : "not_confirmed",
          evidence: [],
        },
        ...current,
      ]);
      showToast(t("toast.mockMode"));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="ai-layout">
      <aside className="prompt-panel card"><div className="prompt-title"><span className="sparkle">✦</span><div><h2>{t("ai.projectTitle")}</h2><p>{t("ai.scope")}</p></div></div><div className="language-control"><span>{t("ai.outputLanguage")}</span><div>{(["中文", "英文", "中英对照"] as OutputLanguage[]).map((option) => <button className={outputLanguage === option ? "active" : ""} key={option} onClick={() => setOutputLanguage(option)}>{label(option)}</button>)}</div></div><span className="prompt-label">{t("ai.quickQuestions")}</span>{aiPrompts.map((item) => <button className="prompt-button" disabled={loading} key={item.prompt} onClick={() => void ask(item.prompt)}><span>✦</span>{t(item.key)}<b>›</b></button>)}</aside>
      <div className="chat-panel card">
        <div className="chat-head"><div><h2>{t("ai.conversation", { code: project.code })}</h2><p><span className="online-dot" /> {t("ai.autoMock")}</p></div><button className="icon-btn">⋯</button></div>
        <div className="chat-scroll">
          {loading && <div className="ai-loading"><span className="online-dot" />{t("ai.loading")}</div>}
          {[...answers, initialAnswer].map((item) => <div className="ai-answer" key={item.id}><div className="answer-meta"><span className="sparkle small-sparkle">✦</span><div><strong>{item.title}</strong><small>TrimFlow AI · {item.mode === "live" ? t("ai.liveAnswer") : t("ai.mockAnswer")}</small></div><div className="answer-actions"><button onClick={() => { void navigator.clipboard?.writeText(item.answer).catch(() => undefined); showToast(t("toast.copied")); }}>{t("ai.copy")}</button><button onClick={() => void ask(item.title)}>{t("ai.regenerate")}</button></div></div><div className="answer-content">{item.answer}</div><div className={`prototype-note ${item.mode === "live" ? "live-note" : ""}`}>{item.mode === "live" ? `✓ ${t("ai.liveNotice")}` : `ⓘ ${t("ai.mockNotice")}`}</div></div>)}
        </div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); void ask(input); }}><textarea value={input} disabled={loading} onChange={(e) => setInput(e.target.value)} placeholder={t("ai.placeholder")} rows={2} /><div><span>{t("ai.referenceScope")}</span><Button type="submit" disabled={loading}>{loading ? t("actions.generating") : t("ai.send")}</Button></div></form>
      </div>
    </div>
  );
}


function SimplePage({ type }: { type: "templates" | "settings" }) {
  const { t, label, text } = useI18n();
  const templates: Array<{ icon: string; title: LocalizedText; type: LocalizedText; description: LocalizedText }> = [
    { icon: "✉", title: { zh: "样品寄出通知", en: "Sample Dispatch Notice" }, type: { zh: "英文邮件", en: "English Email" }, description: { zh: "告知客户样品版本、物流单号和预计签收时间。", en: "Tell the client the sample version, tracking number, and expected arrival." } },
    { icon: "¥", title: { zh: "报价跟进邮件", en: "Quotation Follow-up Email" }, type: { zh: "英文邮件", en: "English Email" }, description: { zh: "报价发出后 3–5 天的礼貌跟进模板。", en: "A polite follow-up template for 3–5 days after a quotation is sent." } },
    { icon: "▤", title: { zh: "销售项目周报", en: "Sales Project Report" }, type: { zh: "内部报告", en: "Internal Report" }, description: { zh: "结构化汇总客户、样品、报价、风险与行动。", en: "Summarize clients, samples, quotations, risks, and actions in a structured report." } },
    { icon: "✓", title: { zh: "新品开发任务单", en: "New Product Development Tasks" }, type: { zh: "内部协作", en: "Internal Collaboration" }, description: { zh: "将客户需求拆解为技术、采购和销售任务。", en: "Break client requirements into technical, sourcing, and sales tasks." } },
    { icon: "!", title: { zh: "价格谈判清单", en: "Price Negotiation Checklist" }, type: { zh: "谈判准备", en: "Negotiation Preparation" }, description: { zh: "整理守价区间、交换条件与不可让步项。", en: "Organize the pricing boundary, trade-offs, and non-negotiable terms." } },
    { icon: "◈", title: { zh: "样品反馈表", en: "Sample Feedback Form" }, type: { zh: "中英对照", en: "Bilingual" }, description: { zh: "快速记录外观、功能、颜色与测试反馈。", en: "Quickly record appearance, function, color, and testing feedback." } },
  ];
  if (type === "templates") return <><PageHeader title={t("templates.title")} subtitle={t("templates.subtitle")} actions={<Button>＋ {t("templates.new")}</Button>} /><div className="template-grid">{templates.map((item) => <Card className="template-card" key={text(item.title)}><span className="template-icon">{item.icon}</span><Badge>{text(item.type)}</Badge><h2>{text(item.title)}</h2><p>{text(item.description)}</p><Button variant="secondary">{t("actions.useTemplate")}</Button></Card>)}</div></>;
  return <><PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} /><div className="settings-layout"><Card><div className="card-head"><div><h2>{t("settings.workspace")}</h2><p>{t("settings.sessionOnly")}</p></div></div><div className="settings-list"><label><div><strong>{t("settings.interfaceLanguage")}</strong><span>{t("settings.interfaceHelp")}</span></div><select><option>{label("中文")}</option><option>{label("英文")}</option></select></label><label><div><strong>{t("settings.aiLanguage")}</strong><span>{t("settings.aiLanguageHelp")}</span></div><select><option>{label("中文")}</option><option>{label("英文")}</option><option>{label("中英对照")}</option></select></label><label><div><strong>{t("settings.currency")}</strong><span>{t("settings.currencyHelp")}</span></div><select><option>USD</option><option>EUR</option><option>CNY</option></select></label><label><div><strong>{t("settings.riskAlerts")}</strong><span>{t("settings.riskHelp")}</span></div><button className="switch active"><span /></button></label></div></Card><Card className="prototype-card"><span className="sparkle">✦</span><h2>{t("settings.prototypeTitle")}</h2><p>{t("settings.prototypeCopy")}</p><Badge tone="blue">{t("settings.prototypeVersion")}</Badge></Card></div></>;
}

export default function Home() {
  const { language, setLanguage, t, label } = useI18n();
  const [view, setView] = useState<View>("dashboard");
  const [projects, setProjects] = useState(initialProjects);
  const [accountState, setAccountState] = useState(createAccountState);
  const accountStateRef = useRef(accountState);
  const [dealRoomState, setDealRoomState] = useState(createDealRoomState);
  const dealRoomRef = useRef(dealRoomState);
  const [taskWorkspace, setTaskWorkspace] = useState(createTaskWorkspace);
  const [projectActivities, setProjectActivities] = useState<TimelineEvent[]>([]);
  const [memoryState, setMemoryState] = useState(emptyActivityMemory);
  const [reportState, setReportState] = useState(emptyReportState);
  const [issueState, setIssueState] = useState(createIssueWorkspace);
  const [issueIntent, setIssueIntent] = useState<IssueIntent | null>(null);
  const [reportInitialTab, setReportInitialTab] = useState<"daily" | "weekly" | "evidence">("daily");
  const [activeRoomId, setActiveRoomId] = useState("room-nas-project");
  const [dealReturnView, setDealReturnView] = useState<"account-detail" | "detail">("account-detail");
  const [activeAccountId, setActiveAccountId] = useState("client-nas");
  const [accountTab, setAccountTab] = useState<AccountTab>("overview");
  const [activeProject, setActiveProject] = useState<Project>(initialProjects[0]);
  const [sampleWorkspace, dispatchSample] = useReducer(sampleWorkspaceReducer, undefined, createSampleWorkspace);
  const [quotationWorkspace, dispatchQuotation] = useReducer(quotationWorkspaceReducer, undefined, createQuotationWorkspace);
  const [orderWorkspace, dispatchOrder] = useReducer(orderWorkspaceReducer, undefined, createOrderWorkspace);
  const [productLibrary, setProductLibrary] = useState(mockProductLibraryRepository.load);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [productReturnView, setProductReturnView] = useState<View>("products");
  const [productToAdd, setProductToAdd] = useState<{ id: string; variantId?: string } | null>(null);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [activeQuotationId, setActiveQuotationId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [projectTab, setProjectTab] = useState<"overview" | "samples" | "quotations" | "orders">("overview");
  const [newProject, setNewProject] = useState(false);
  const [toast, setToast] = useState("");
  const businessSources: BusinessSources = useMemo(() => ({ accounts: accountState, dealRoom: dealRoomState, projects, projectActivities,
    timeline: caseTimeline, communications: caseCommunications, samples: { versions: sampleWorkspace.versions, feedback: sampleWorkspace.feedback },
    quotations: quotationWorkspace.quotations, negotiations: quotationWorkspace.records, orders: orderWorkspace.orders, contracts: orderWorkspace.contracts,
    deliveries: orderWorkspace.deliveries, shipments: orderWorkspace.shipments, tasks: taskWorkspace, products: productLibrary, issues: issueState, manualEntries: memoryState.manualEntries,
  }), [accountState, dealRoomState, projects, projectActivities, sampleWorkspace, quotationWorkspace, orderWorkspace, taskWorkspace, productLibrary, issueState, memoryState.manualEntries]);
  const memoryCandidates = useMemo(() => adaptSources(businessSources, new Date().toISOString()), [businessSources]);
  const projectedMemory = useMemo(() => reconcileMemory(memoryState, memoryCandidates), [memoryState, memoryCandidates]);
  const dashboardActivityCount = useMemo(() => selectMemory(projectedMemory.items, businessSources, { start: DEMO_REPORT_DATE, end: "2026-08-06", timeZone: DEMO_REPORT_TIME_ZONE, ownerActorId: "actor-sales-a" }).filter((row) => row.eligible).length, [projectedMemory.items, businessSources]);
  useEffect(() => {
    const timer = window.setTimeout(() => setMemoryState((current) => reconcileMemory(current, memoryCandidates)), 0);
    return () => window.clearTimeout(timer);
  }, [memoryCandidates]);
  const embedded = useSyncExternalStore(subscribeToLocation, readEmbeddedMode, readServerEmbeddedMode);
  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(""), 2500); };
  const commitAccounts = (next: AccountState) => { accountStateRef.current = next; setAccountState(next); };
  const executeAccount = (command: (state: AccountState) => AccountState, success: string) => {
    try { commitAccounts(command(accountStateRef.current)); showToast(success); return true; }
    catch (error) { showToast(t("account.failure", { reason: error instanceof Error ? error.message : String(error) })); return false; }
  };
  const commitDealRoom = (next: DealRoomState) => { dealRoomRef.current = next; setDealRoomState(next); };
  const executeDealRoom = (command: (state: DealRoomState) => DealRoomState, success: string) => {
    try { commitDealRoom(command(dealRoomRef.current)); showToast(success); return true; }
    catch (error) { showToast(t("deal.failed", { reason: error instanceof Error ? error.message : String(error) })); return false; }
  };
  const openDealRoom = (id: string, returnView: "account-detail" | "detail" = "account-detail") => { setActiveRoomId(id); setDealReturnView(returnView); setView("deal-room"); window.scrollTo({ top: 0 }); };
  const createDealRoom = (accountId: string, projectId?: number) => {
    const existing = dealRoomRef.current.rooms.find((item) => item.status === "active" && item.accountId === accountId && item.projectId === projectId);
    const returnView = projectId === undefined ? "account-detail" : "detail";
    if (existing) { openDealRoom(existing.id, returnView); return; }
    const project = projects.find((item) => item.id === projectId);
    const participants = suggestRoomParticipants(accountStateRef.current, accountId, project?.ownerActorId);
    if (!participants.length) participants.push("actor-sales-b");
    const id = `room-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const name = project?.code ?? accountStateRef.current.accounts.find((item) => item.id === accountId)?.name ?? "Account";
    const ok = executeDealRoom((state) => createRoom(state, { id, accountId, projectId, title: { zh: `${name} 内部协作`, en: `${name} Team Collaboration` }, status: "active", participantActorIds: participants, createdAt: now, updatedAt: now }, accountStateRef.current, projects), t("deal.created"));
    if (ok) openDealRoom(id, returnView);
  };
  const applyDealProposal = (proposalId: string, actorId: string) => {
    try {
      const result = applyReviewedProposal(dealRoomRef.current, proposalId, { accounts: accountStateRef.current, projects, samples: sampleWorkspace, actorId, at: new Date().toISOString() });
      if (result.alreadyApplied) { showToast(t("deal.applied")); return false; }
      const createdTasks = result.dealRoom.tasks.filter((item) => !dealRoomRef.current.tasks.some((prior) => prior.id === item.id));
      if (createdTasks.length) setTaskWorkspace((current) => createdTasks.reduce((state, task) => createWorkspaceTask(state, { ...task, origin: "deal_room" }, actorId, new Date().toISOString(), `deal-${proposalId}`, [{ provider: "trimflow", recordType: "deal_proposal", recordId: proposalId }, ...task.sourceMessageIds.map((id) => ({ provider: "trimflow" as const, recordType: "deal_message", recordId: id }))]), current));
      commitDealRoom(result.dealRoom);
      commitAccounts(result.accounts);
      if (result.sampleFeedback) dispatchSample({ type: "feedback", feedback: result.sampleFeedback });
      showToast(t("deal.applySaved"));
      return true;
    } catch (error) { showToast(t("deal.failed", { reason: error instanceof Error ? error.message : String(error) })); return false; }
  };
  const openAccount = (id: string, tab: AccountTab = "overview") => { setActiveAccountId(id); setAccountTab(tab); setView("account-detail"); window.scrollTo({ top: 0 }); };
  const createProspect = (input: ProspectInput, actorId = "actor-sales-b", id = `account-new-${Date.now()}`) => {
    const now = new Date().toISOString();
    const account: Account = { id, workspaceId: "demo", code: `PR-${id.slice(-6)}`, name: input.name.trim(), country: input.country.trim(), region: input.region.trim(), type: input.kind, status: "培育中", currency: "USD", paymentTerm: "待确认", communicationLanguage: "English", primaryContactId: "", lastContactAt: "", preferences: [], kind: input.kind, aliases: [], domains: input.domain.trim() ? [input.domain.trim()] : [], lifecycle: "prospect", recordStatus: "canonical", revision: 1 };
    const discovery = { id: `discovery-${id}`, accountId: id, discoveredByActorId: actorId, discoveredAt: now, sourceType: "market_research" as const, sourceDetail: { zh: "演示中新建潜在客户", en: "Prospect created in demo" }, recordedByActorId: actorId, recordedAt: now };
    commitAccounts(addProspect(accountStateRef.current, account, discovery, { id: `event-${id}`, at: now, actorId }));
    return id;
  };
  const resolveDuplicate = (candidateIds: string[], decision: DuplicateResolution["decision"], reason: string, signals: DuplicateResolution["signals"] = [], proposedName?: string, actorId = "actor-sales-b") => {
    const state = accountStateRef.current; const now = new Date().toISOString();
    const resolution: DuplicateResolution = { id: `resolution-${crypto.randomUUID()}`, candidateAccountIds: candidateIds, proposedName, signals, recordVersions: Object.fromEntries(candidateIds.map((id) => [id, state.accounts.find((item) => item.id === id)?.revision ?? 0])), decision, reason, resolvedByActorId: actorId, resolvedAt: now };
    commitAccounts(recordDuplicateResolution(state, resolution));
  };
  const requestAccountCollaboration = (id: string, actorId = "actor-sales-b") => {
    return executeAccount((state) => requestCollaboration(state, { accountId: id }, { zh: "演示客户协作申请", en: "Demo account collaboration request" }, { id: crypto.randomUUID(), at: new Date().toISOString(), actorId }), t("account.requested"));
  };
  const openProject = (p: Project, initialTab: "overview" | "samples" | "quotations" | "orders" = "overview") => { setProjectTab(initialTab); setActiveProject(p); setView("detail"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openSample = (id: string) => { setActiveSampleId(id); setView("sample-detail"); window.scrollTo({ top: 0 }); };
  const openQuotation = (id: string) => { setActiveQuotationId(id); setView("quotation-detail"); window.scrollTo({ top: 0 }); };
  const openOrder = (id: string) => { setActiveOrderId(id); setView("order-detail"); window.scrollTo({ top: 0 }); };
  const openIssues = (intent: IssueIntent = {}) => { setIssueIntent(intent); setView("issues"); window.scrollTo({ top: 0 }); };
  const openProduct = (id: string) => { setProductReturnView(view); setActiveProductId(id); setView("product-detail"); window.scrollTo({ top: 0 }); };
  const activeSample = sampleWorkspace.samples.find((sample) => sample.id === activeSampleId);
  const activeQuotation = quotationWorkspace.quotations.find((quotation) => quotation.id === activeQuotationId);
  const activeOrder = orderWorkspace.orders.find((order) => order.id === activeOrderId);
  const updateStage = (stage: Stage) => {
    setActiveProject((p) => ({ ...p, stage }));
    setProjects((all) => all.map((p) => p.id === activeProject.id ? { ...p, stage } : p));
    showToast(t("toast.stageUpdated", { stage: label(stage) }));
  };
  const activeNav: WorkspaceView = view === "detail" ? "projects" : view === "account-detail" ? "clients" : view === "deal-room" ? (dealReturnView === "detail" ? "projects" : "clients") : view === "product-detail" ? "products" : view === "sample-detail" ? "samples" : view === "quotation-detail" ? "quotations" : view === "order-detail" ? "orders" : view;
  const title = useMemo(() => { const item = workspaceNavigation.find((entry) => entry.id === activeNav); return item ? t(item.key) : t("nav.dashboard"); }, [activeNav, t]);
  const isPlaceholder = view !== "detail" && view !== "account-detail" && view !== "deal-room" && view !== "product-detail" && view !== "sample-detail" && view !== "quotation-detail" && view !== "order-detail" && placeholderViews.has(view);
  const addCurrentProduct = (projectId: number, variantId: string | undefined, note: string) => {
    if (!productToAdd || !projects.some((project) => project.id === projectId)) return false;
    const product = getProductById(productLibrary, productToAdd.id);
    if (!product) return false;
    const next = addProductToProject(productLibrary, { projectId, productId: product.id, variantId, source: "library", applicationNote: { zh: note, en: note }, proposalStatus: "candidate" });
    if (next === productLibrary) { showToast(t("product.alreadyLinked")); return false; }
    setProductLibrary(next);
    showToast(t("product.addSuccess"));
    return true;
  };
  const createOrOpenQuotation = (sampleId: string) => {
    const sample = sampleWorkspace.samples.find((item) => item.id === sampleId);
    if (!sample) return;
    const context = getSampleContext(sample, sampleWorkspace, projects, accountState);
    const result = createDraftFromSample(context, quotationWorkspace);
    if ("existing" in result && result.existing) {
      openQuotation(result.existing.id);
      showToast(t("toast.quoteExisting"));
      return;
    }
    if (!getSampleReadiness(context).ready) {
      showToast(t("toast.sampleNotReady"));
      return;
    }
    dispatchQuotation({ type: "create", quotation: result.quotation, tiers: result.tiers });
    setActiveQuotationId(result.quotation.id);
    setView("quotation-detail");
    window.scrollTo({ top: 0 });
    showToast(t("toast.quoteCreated"));
  };
  const createForProject = (project: Project) => {
    const candidates = sampleWorkspace.samples.filter((item) => item.projectId === project.id);
    const approved = candidates.find((item) => getSampleReadiness(getSampleContext(item, sampleWorkspace, projects, accountState)).ready);
    if (approved) createOrOpenQuotation(approved.id);
    else {
      setView("quotations");
      showToast(t("toast.projectSampleNotReady"));
    }
  };
  const createOrOpenOrder = (quotationId: string) => {
    const quotation = quotationWorkspace.quotations.find((item) => item.id === quotationId);
    if (!quotation) {
      showToast(t("toast.quoteMissing"));
      return;
    }
    const result = createOrderFromQuote(quotation, orderWorkspace, projects, accountState);
    if ("existing" in result && result.existing) {
      openOrder(result.existing.id);
      showToast(t("toast.orderExisting"));
      return;
    }
    if ("blocked" in result && result.blocked) {
      showToast(t("toast.orderBlocked"));
      return;
    }
    dispatchOrder({ type: "create", order: result.order, lines: result.lines, contract: result.contract, delivery: result.delivery, shipment: result.shipment });
    setActiveOrderId(result.order.id);
    setView("order-detail");
    window.scrollTo({ top: 0 });
    showToast(t("toast.orderCreated"));
  };
  const changeLanguage = (nextLanguage: InterfaceLanguage) => {
    setLanguage(nextLanguage);
    showToast(nextLanguage === "zh" ? t("toast.languageZh") : t("toast.languageEn"));
  };
  const createTask = (task: WorkspaceTask, actorId: string) => {
    try {
      if (projects.find((item) => item.id === task.projectId)?.clientId !== task.accountId) throw new Error("Task scope mismatch");
      setTaskWorkspace((current) => createWorkspaceTask(current, task, actorId, new Date().toISOString(), `create-${task.id}`));
      showToast(t("report.saveSuccess"));
    } catch (error) { showToast(error instanceof Error ? error.message : String(error)); }
  };
  const toggleTask = (taskId: string, actorId: string) => {
    const task = taskWorkspace.tasks.find((row) => row.id === taskId);
    if (!task) return;
    const toStatus = task.status === "已完成" ? "待处理" : "已完成";
    try { setTaskWorkspace((current) => changeTaskStatus(current, taskId, toStatus, actorId, new Date().toISOString(), crypto.randomUUID())); showToast(toStatus === "已完成" ? t("toast.taskCompleted") : t("toast.taskRestored")); }
    catch (error) { showToast(error instanceof Error ? error.message : String(error)); }
  };
  const generateActivityReport = (input: { kind: ReportKind; date: string; timeZone: string; ownerActorId: string; attributionMode: AttributionMode; language: ReportLanguage; accountId?: string; projectId?: number; fromReportId?: string }) => {
    try {
      const now = new Date().toISOString();
      const context = createReportContext({ id: `context:${crypto.randomUUID()}`, ownerActorId: input.ownerActorId, attributionMode: input.attributionMode, period: createReportPeriod(input.kind, input.date, input.timeZone), language: input.language, accountId: input.accountId, projectId: input.projectId, capturedAt: now }, projectedMemory.items, businessSources);
      const result = generateReport(reportState, context, new DemoReportGenerator(), now, input.fromReportId);
      setReportState(result.state);
      showToast(t("report.generateSuccess"));
      return result.draft.id;
    } catch (error) { showToast(error instanceof Error ? error.message : String(error)); return undefined; }
  };
  const updateReport = (command: (current: typeof reportState) => typeof reportState, success: string) => {
    try { setReportState(command(reportState)); showToast(success); }
    catch (error) { showToast(error instanceof Error ? error.message : String(error)); }
  };
  const addManual = (entry: ManualActivityEntry) => {
    try { setMemoryState((current) => addManualActivity(current, entry)); showToast(t("report.saveSuccess")); }
    catch (error) { showToast(error instanceof Error ? error.message : String(error)); }
  };
  const copyReport = (content: string) => { void navigator.clipboard?.writeText(content).then(() => showToast(t("report.copySuccess"))).catch(() => showToast(t("report.invalid"))); };
  const handleGlobalCreate = (type: GlobalCreateType) => {
    if (type === "project") {
      setNewProject(true);
      return;
    }
    if (type === "sample") {
      setView("samples");
      showToast(t("toast.sampleWorkspaceOpened"));
      return;
    }
    if (type === "quotation") {
      setView("quotations");
      showToast(t("toast.quoteWorkspaceOpened"));
      return;
    }
    if (type === "task") setView("todos");
    showToast(t("toast.createPending", { type: t("tasks.title") }));
  };
  return (
    <>
      <WorkspaceShell
        embedded={embedded}
        activeView={activeNav}
        currentTitle={title}
        language={language}
        todoCount={taskWorkspace.tasks.filter((task) => task.status !== "已完成").length}
        onNavigate={setView}
        onLanguageChange={changeLanguage}
        onGlobalCreate={handleGlobalCreate}
      >
          {view === "dashboard" && <DashboardView projects={projects} accountState={accountState} sharedTasks={taskWorkspace.tasks} reportableToday={dashboardActivityCount} dailyReportStatus={reportState.drafts.filter((row) => row.kind === "daily").at(-1)?.status} weeklyReportStatus={reportState.drafts.filter((row) => row.kind === "weekly").at(-1)?.status} onOpenReports={() => { setReportInitialTab("daily"); setView("reports"); }} onOpenProject={openProject} onNavigate={setView} onOpenNewProject={() => setNewProject(true)} />}
          {view === "clients" && <AccountCenter state={accountState} business={{ projects, products: productLibrary, samples: sampleWorkspace, quotations: quotationWorkspace, orders: orderWorkspace }} onOpen={openAccount} onCreate={createProspect} onResolve={resolveDuplicate} onRequest={requestAccountCollaboration} showToast={showToast} />}
          {view === "account-detail" && <AccountWorkspace key={`${activeAccountId}-${accountTab}`} state={accountState} accountId={activeAccountId} initialTab={accountTab} business={{ projects, products: productLibrary, samples: sampleWorkspace, quotations: quotationWorkspace, orders: orderWorkspace }} dealRoomState={dealRoomState} issues={issueState.issues.filter((issue) => issue.accountId === activeAccountId)} onOpenIssue={(id) => openIssues({ issueId: id })} onCreateIssue={() => openIssues({ accountId: activeAccountId, create: true })} onOpenDealRoom={(id) => openDealRoom(id, "account-detail")} onCreateDealRoom={() => createDealRoom(activeAccountId)} recentMemory={projectedMemory.items.filter((item) => item.accountId === activeAccountId && item.status === "active").slice(-3).reverse()} onOpenReports={() => { setReportInitialTab("evidence"); setView("reports"); }} onBack={() => setView("clients")} onOpenProject={(id) => { const p = projects.find((item) => item.id === id); if (p) openProject(p); }} execute={executeAccount} />}
          {view === "projects" && <Projects projects={projects} openProject={openProject} openNew={() => setNewProject(true)} />}
          {view === "products" && <ProductLibrary data={productLibrary} onOpen={openProduct} />}
          {view === "product-detail" && activeProductId && <ProductLibraryDetail key={activeProductId} data={productLibrary} productId={activeProductId} onBack={() => setView(productReturnView === "product-detail" ? "products" : productReturnView)} onAdd={(id, variantId) => setProductToAdd({ id, variantId })} />}
          {view === "detail" && <ProjectDetail project={activeProject} accountState={accountState} dealRoomState={dealRoomState} sharedTasks={taskWorkspace.tasks} projectActivities={projectActivities} onAddProjectActivity={(event) => setProjectActivities((current) => [event, ...current])} recentMemory={projectedMemory.items.filter((item) => item.projectId === activeProject.id && item.status === "active").slice(-3).reverse()} onOpenReports={() => setView("reports")} onOpenDealRoom={(id) => openDealRoom(id, "detail")} onCreateDealRoom={createDealRoom} onBack={() => setView("projects")} updateStage={updateStage} showToast={showToast} sampleWorkspace={sampleWorkspace} quotationWorkspace={quotationWorkspace} orderWorkspace={orderWorkspace} productLibrary={productLibrary} onBrowseProducts={() => setView("products")} onOpenProduct={openProduct} onOpenSample={openSample} onOpenQuotation={openQuotation} onCreateQuotation={() => createForProject(activeProject)} onOpenOrder={openOrder} issues={issueState} onOpenIssue={(id) => openIssues({ issueId: id })} onCreateIssue={() => openIssues({ accountId: activeProject.clientId, projectId: activeProject.id, create: true })} language={language} initialTab={projectTab} />}
          {view === "deal-room" && <DealRoomWorkspace key={activeRoomId} state={dealRoomState} accounts={accountState} projects={projects} samples={sampleWorkspace} quotations={quotationWorkspace} roomId={activeRoomId} onRoomChange={setActiveRoomId} onBack={() => setView(dealReturnView)} onAccount={openAccount} onProject={openProject} run={executeDealRoom} onApply={applyDealProposal} onOpenActivity={() => { setReportInitialTab("evidence"); setView("reports"); }} onSuggestIssue={(messageId) => { const room = dealRoomState.rooms.find((item) => item.id === activeRoomId); if (!room) return; try { setIssueState((current) => addIssueSuggestion(current, { id: `suggestion-${crypto.randomUUID()}`, roomId: room.id, accountId: room.accountId, projectId: room.projectId, sourceMessageIds: [messageId], status: "suggested", suggestedAt: new Date().toISOString() }, dealRoomState)); showToast(language === "zh" ? "已创建待审核问题线索" : "Issue suggestion created for review"); } catch { showToast(language === "zh" ? "线索创建失败" : "Could not create suggestion"); } }} />}
          {view === "samples" && <SampleCenter workspace={sampleWorkspace} projects={projects} accountState={accountState} onOpenSample={openSample} language={language} />}
          {view === "sample-detail" && activeSample && <SampleDetail key={activeSample.id} context={getSampleContext(activeSample, sampleWorkspace, projects, accountState)} language={language} dispatch={dispatchSample} onBack={() => setView("samples")} onProject={() => { const p = projects.find((project) => project.id === activeSample.projectId); if (p) openProject(p, "samples"); }} onClient={() => openAccount(activeSample.clientId)} onCreateQuotation={() => createOrOpenQuotation(activeSample.id)} issues={issueState.issues.filter((issue) => issue.sampleId === activeSample.id)} onOpenIssue={(id) => openIssues({ issueId: id })} onCreateIssue={() => openIssues({ accountId: activeSample.clientId, projectId: activeSample.projectId, sampleId: activeSample.id, create: true })} showToast={showToast} />}
          {view === "quotations" && <QuotationCenter workspace={quotationWorkspace} projects={projects} accountState={accountState} language={language} onOpenQuotation={openQuotation} onCreate={() => createForProject(activeProject)} />}
          {view === "quotation-detail" && activeQuotation && <QuotationDetail key={activeQuotation.id} context={getQuotationContext(activeQuotation, quotationWorkspace, projects, accountState)} language={language} dispatch={dispatchQuotation} onBack={() => setView("quotations")} onProject={() => { const p = projects.find((project) => project.id === activeQuotation.projectId); if (p) openProject(p, "quotations"); }} onSample={openSample} onOpenVersion={openQuotation} onCreatePO={() => createOrOpenOrder(activeQuotation.id)} showToast={showToast} />}
          {view === "orders" && <OrderCenter workspace={orderWorkspace} quotationWorkspace={quotationWorkspace} projects={projects} accountState={accountState} language={language} onOpenOrder={openOrder} />}
          {view === "order-detail" && activeOrder && <OrderDetail key={activeOrder.id} context={getOrderContext(activeOrder, orderWorkspace, quotationWorkspace, projects, accountState)} language={language} dispatch={dispatchOrder} onBack={() => setView("orders")} onClient={() => openAccount(activeOrder.clientId)} onProject={() => { const p = projects.find((project) => project.id === activeOrder.projectId); if (p) openProject(p, "orders"); }} onQuotation={() => openQuotation(activeOrder.quotationId)} issues={issueState.issues.filter((issue) => issue.orderId === activeOrder.id)} onOpenIssue={(id) => openIssues({ issueId: id })} onCreateIssue={() => openIssues({ accountId: activeOrder.clientId, projectId: activeOrder.projectId, orderId: activeOrder.id, create: true })} showToast={showToast} />}
          {view === "issues" && <IssuesWorkspace state={issueState} context={{ accounts: accountState, projects, samples: sampleWorkspace, orders: orderWorkspace, products: productLibrary, dealRoom: dealRoomState }} intent={issueIntent} onIntentConsumed={() => setIssueIntent(null)} onChange={setIssueState} showToast={showToast} />}
          {view === "todos" && <TaskList state={taskWorkspace} accounts={accountState} projects={projects} onCreate={createTask} onToggle={toggleTask} />}
          {view === "reports" && <ReportsCenter sources={businessSources} items={projectedMemory.items} state={reportState} initialTab={reportInitialTab} onGenerate={generateActivityReport} onEdit={(id, blockId, value) => updateReport((current) => editReportBlock(current, id, blockId, value, new Date().toISOString()), t("report.saveSuccess"))} onNote={(id, value) => updateReport((current) => addReportHumanNote(current, id, value, new Date().toISOString()), t("report.saveSuccess"))} onReview={(id, actorId) => updateReport((current) => reviewReport(current, id, actorId, new Date().toISOString()), t("report.reviewSuccess"))} onFinalize={(id, actorId) => updateReport((current) => finalizeReport(current, id, actorId, new Date().toISOString()).state, t("report.finalSuccess"))} onManual={addManual} onCopy={copyReport} />}
          {view === "ai" && <><PageHeader title={t("ai.title")} subtitle={language === "zh" ? `当前关联项目：${activeProject.code} · ${activeProject.name}` : `Current project: ${activeProject.code} · ${label(activeProject.name)}`} /><AIAssistant project={activeProject} showToast={showToast} /></>}
          {(view === "templates" || view === "settings") && <SimplePage type={view} />}
          {isPlaceholder && <EmptyState title={title} description={t("errors.modulePending")} />}
      </WorkspaceShell>
      {newProject && <NewProjectDialog accountState={accountState} business={{ projects, products: productLibrary, samples: sampleWorkspace, quotations: quotationWorkspace, orders: orderWorkspace }} onClose={() => setNewProject(false)} onOpenAccount={openAccount} onResolve={resolveDuplicate} onRequestCollaboration={requestAccountCollaboration} showToast={showToast} onCreate={(p, prospect, separate) => { try { if (prospect) createProspect(prospect, separate?.actorId ?? p.ownerActorId ?? "actor-sales-b", p.clientId); validateProjectAccountReference(accountStateRef.current, p); if (separate) resolveDuplicate([...separate.candidates, p.clientId], "keep_separate", separate.reason, separate.signals, prospect?.name, separate.actorId); setProjects((x) => [p, ...x]); setNewProject(false); showToast(t("toast.projectCreated")); openProject(p); } catch (error) { showToast(t("account.failure", { reason: error instanceof Error ? error.message : String(error) })); } }} />}
      {productToAdd && getProductById(productLibrary, productToAdd.id) && <AddProductToProjectDialog product={getProductById(productLibrary, productToAdd.id)!} variants={getVariantsForProduct(productLibrary, productToAdd.id)} projects={projects} initialVariantId={productToAdd.variantId} onAdd={addCurrentProduct} onClose={() => setProductToAdd(null)} />}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </>
  );
}
