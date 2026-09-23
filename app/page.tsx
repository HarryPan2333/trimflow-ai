"use client";

import "../components/samples/sample-workspace.css";
import "../components/quotations/quotation-workspace.css";
import "../components/orders/order-workspace.css";
import "../components/products/product-workspace.css";
import "../components/theme/steep-editorial.css";

import { useMemo, useReducer, useState, useSyncExternalStore } from "react";
import { EmptyState } from "../components/business/empty-state";
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
import { Badge, Button, Card, Modal } from "../components/ui/primitives";
import { useI18n } from "../components/providers/language-provider";
import {
  projects as initialProjects,
  clients,
  projectStages as stages,
  tasks as mockTasks,
} from "../lib/mock-data";
import type { Project, ProjectStage as Stage } from "../lib/mock-data";
import type { LocalizedText } from "../lib/i18n";

type OutputLanguage = "中文" | "英文" | "中英对照";
type View = WorkspaceView | "detail" | "product-detail" | "sample-detail" | "quotation-detail" | "order-detail";

const placeholderViews = new Set<WorkspaceView>(["clients", "fulfillment"]);

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
  language,
  initialTab,
}: {
  project: Project;
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
  language: InterfaceLanguage;
  initialTab: "overview" | "samples" | "quotations" | "orders";
}) {
  return (
    <ProjectCommandCenter
      key={project.id}
      project={project}
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

function Todos({ showToast }: { showToast: (s: string) => void }) {
  const { t, text } = useI18n();
  const [done, setDone] = useState<number[]>([3]);
  const tasks: Array<{ priority: string; title: LocalizedText; client: string | LocalizedText; due: LocalizedText; owner: string; today?: boolean }> = [
    { priority: "P1", title: { zh: "跟进 NAS-2407 样品测试安排", en: "Follow up on the NAS-2407 sample testing schedule" }, client: "North American Sportswear Brand", due: { zh: "今天 10:30", en: "Today, 10:30 AM" }, owner: "陈晨", today: true },
    { priority: "P1", title: { zh: "完成 EFC-2411 测试费与模具费说明", en: "Complete the EFC-2411 testing and tooling fee explanation" }, client: "European Fashion Client", due: { zh: "今天 14:00", en: "Today, 2:00 PM" }, owner: "王璐", today: true },
    { priority: "P2", title: { zh: "发送瑜伽系列产品规格确认表", en: "Send the yoga collection specification confirmation sheet" }, client: "Emerging Yoga Wear Brand", due: { zh: "今天 17:00", en: "Today, 5:00 PM" }, owner: "林薇", today: true },
    { priority: "P2", title: { zh: "整理户外客户的三档数量报价", en: "Prepare three volume tiers for the outdoor client" }, client: "Outdoor Clothing Client", due: { zh: "明天", en: "Tomorrow" }, owner: "陈晨" },
    { priority: "P3", title: { zh: "更新本周项目周报", en: "Update this week's project report" }, client: { zh: "全部项目", en: "All Projects" }, due: { zh: "周五 16:00", en: "Friday, 4:00 PM" }, owner: "陈晨" },
  ];
  return <><PageHeader title={t("tasks.title")} subtitle={t("tasks.subtitle")} actions={<Button>＋ {t("tasks.add")}</Button>} /><div className="todo-summary"><Card><span>{t("tasks.todayDue")}</span><strong>3</strong></Card><Card><span>{t("tasks.weekTotal")}</span><strong>9</strong></Card><Card><span>{t("tasks.completed")}</span><strong>6</strong></Card><Card><span>{t("tasks.overdue")}</span><strong className="red-text">1</strong></Card></div><Card><div className="card-head"><div><h2>{t("tasks.myTasks")}</h2><p>{t("tasks.sortHelp")}</p></div><div className="segment"><button className="active">{t("common.all")}</button><button>{t("tasks.today")}</button><button>{t("tasks.filterWeek")}</button></div></div><div className="task-list">{tasks.map((task, i) => <div className={`task-row ${done.includes(i) ? "task-done" : ""}`} key={text(task.title)}><button className="task-check" onClick={() => { setDone((x) => x.includes(i) ? x.filter((n) => n !== i) : [...x, i]); showToast(done.includes(i) ? t("toast.taskRestored") : t("toast.taskCompleted")); }}>{done.includes(i) ? "✓" : ""}</button><span className={task.priority === "P1" ? "priority p1" : "priority"}>{task.priority}</span><div className="task-main"><strong>{text(task.title)}</strong><small>{text(task.client)}</small></div><span>{task.owner}</span><Badge tone={task.today ? "red" : "neutral"}>{text(task.due)}</Badge><button className="icon-btn">⋯</button></div>)}</div></Card></>;
}

function Reports({ showToast }: { showToast: (s: string) => void }) {
  const { t, label, text } = useI18n();
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("中文");
  const sections = [
    [t("reports.completed"), { zh: "完成 V2 防水拉链样品制作并于 7 月 24 日寄出；客户已签收。", en: "Completed the V2 waterproof zipper samples, shipped them on July 24, and received client delivery confirmation." }],
    [t("reports.clientFeedback"), { zh: "客户将优先测试 64 cm 黑色款，预计本周四提供初步结果。", en: "The client will test the 64 cm black version first and expects to share initial results this Thursday." }],
    [t("reports.sampleProgress"), { zh: "膜面光泽与灰色色差已按 V1 反馈调整，V2 进入客户测试。", en: "Film gloss and the gray color difference were adjusted from V1 feedback; V2 is now under client testing." }],
    [t("reports.quoteProgress"), { zh: "正在准备 80K / 120K / 200K 三档模拟报价，基础参考价为 USD 0.88 / 条。", en: "Synthetic quotation tiers for 80K / 120K / 200K units are in preparation, with a recorded reference of USD 0.88 per piece." }],
    [t("reports.risks"), { zh: "客户与技术部对洗后测试次数的口径不一致，可能影响成本与交期。", en: "The client and technical team are not aligned on the number of post-wash test cycles, which may affect cost and lead time." }],
    [t("reports.openIssues"), { zh: "确认测试标准、Logo 图稿、目标价格及各长度数量占比。", en: "Confirm the testing standard, logo artwork, target price, and volume split by length." }],
    [t("reports.nextWeek"), { zh: "取得测试反馈；完成阶梯报价；推进 Logo 与包装要求确认。", en: "Obtain test feedback, complete tiered pricing, and confirm logo and packaging requirements." }],
    [t("reports.support"), { zh: "如客户坚持 5 次水洗标准，需技术总监确认新膜材方案与价格底线。", en: "If the client requires five wash cycles, the technical director must confirm the new film solution and pricing boundary." }],
  ];
  return <><PageHeader title={t("reports.title")} subtitle={t("reports.subtitle")} actions={<span className="week-picker">‹　{t("reports.period")}　›</span>} /><div className="report-toolbar card"><div><span>{t("reports.language")}</span><div className="segment">{(["中文", "英文", "中英对照"] as OutputLanguage[]).map((option) => <button key={option} className={outputLanguage === option ? "active" : ""} onClick={() => setOutputLanguage(option)}>{label(option)}</button>)}</div></div><div className="page-actions"><Button variant="secondary" onClick={() => showToast(t("toast.reportCopied"))}>{t("reports.copyContent")}</Button><Button variant="secondary" onClick={() => showToast(t("toast.reportExported"))}>{t("reports.exportMarkdown")}</Button><Button onClick={() => showToast(t("toast.reportRegenerated", { language: label(outputLanguage) }))}>✦ {t("reports.regenerate")}</Button></div></div><div className="report-grid">{initialProjects.slice(0, 3).map((p, idx) => <Card className="report-card" key={p.id}><div className="report-card-head"><div className="detail-title"><span className="client-avatar" style={{ background: p.color }}>{p.initials}</span><div><span className="project-code">{p.code}</span><h2>{text(p.name)}</h2><p>{text(p.customer)}</p></div></div><StatusBadge status={p.stage} /></div><div className="report-sections">{sections.map(([title, body], sidx) => <div key={String(title)}><strong>{String(title)}</strong><p>{idx === 1 && sidx === 0 ? text({ zh: "已提交 V2 阶梯报价，并补充报价有效期说明。", en: "Submitted the V2 tiered quotation and clarified its validity period." }) : idx === 2 && sidx === 0 ? text({ zh: "已整理客户概念板和初步产品组合。", en: "Organized the client concept board and initial product assortment." }) : text(body as LocalizedText)}</p></div>)}</div><div className="report-footer"><span>✦ {t("reports.mockGenerated")}</span><div><button onClick={() => showToast(t("toast.reportCopied"))}>{t("reports.copy")}</button><button>{t("reports.edit")}</button></div></div></Card>)}</div></>;
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

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Project) => void }) {
  const { t, label, text } = useI18n();
  return <Modal title={t("newProject.title")} onClose={onClose}><form className="modal-form" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const id = Date.now(); const customer = String(f.get("customer")); onCreate({ id, clientId: `client-new-${id}`, code: `NEW-${String(id).slice(-4)}`, name: String(f.get("name")), customer, region: String(f.get("region")), product: String(f.get("product")), stage: String(f.get("stage")) as Stage, lifecycleStage: "inquiry", progress: "项目已创建，等待整理初始客户询盘", owner: String(f.get("owner")), next: "梳理客户询盘并确认缺失信息", updated: "刚刚", lastUpdatedAt: new Date(id).toISOString(), quantity: String(f.get("quantity") || "待确认"), delivery: String(f.get("delivery") || "待确认"), health: "良好", contact: String(f.get("contact") || "待补充"), email: "待补充", initials: "NP", color: "#285c72", currentSummary: "新项目已创建，当前处于询盘整理阶段。", confirmedInformation: [customer], pendingInformation: ["客户需求与产品规格待整理"], risks: [], nextActions: ["梳理客户询盘并确认缺失信息"] }); }}>
    <div className="form-row"><label>{t("newProject.name")}<input name="name" required placeholder={t("newProject.namePlaceholder")} /></label><label>{t("newProject.customer")}<input name="customer" required placeholder={t("newProject.customerPlaceholder")} /></label></div>
    <div className="form-row"><label>{t("newProject.region")}<input name="region" required placeholder={t("newProject.regionPlaceholder")} /></label><label>{t("newProject.contact")}<input name="contact" placeholder={t("newProject.contactPlaceholder")} /></label></div>
    <div className="form-row"><label>{t("newProject.productType")}<select name="product"><option value="防水尼龙拉链">{label("防水尼龙拉链")}</option><option value="金属拉链">{label("金属拉链")}</option><option value="金属纽扣">{label("金属纽扣")}</option><option value="树脂纽扣">{label("树脂纽扣")}</option><option value="绳扣与织带">{label("绳扣与织带")}</option><option value="其他服装辅料">{label("其他服装辅料")}</option></select></label><label>{t("newProject.salesStage")}<select name="stage">{stages.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label></div>
    <div className="form-row"><label>{t("common.owner")}<select name="owner"><option value="陈晨">{text("陈晨")}</option><option value="王璐">{text("王璐")}</option><option value="林薇">{text("林薇")}</option></select></label><label>{t("newProject.quantity")}<input name="quantity" placeholder={t("newProject.quantityPlaceholder")} /></label></div>
    <label>{t("newProject.delivery")}<input name="delivery" type="date" /></label><label>{t("newProject.inquiry")}<textarea rows={4} placeholder={t("newProject.inquiryPlaceholder")} /></label><label>{t("newProject.notes")}<textarea rows={2} placeholder={t("newProject.notesPlaceholder")} /></label>
    <div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose}>{t("common.cancel")}</Button><Button type="submit">{t("actions.createProject")}</Button></div>
  </form></Modal>;
}

export default function Home() {
  const { language, setLanguage, t, label, text } = useI18n();
  const [view, setView] = useState<View>("dashboard");
  const [projects, setProjects] = useState(initialProjects);
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
  const [sampleClientId, setSampleClientId] = useState<string | null>(null);
  const [projectTab, setProjectTab] = useState<"overview" | "samples" | "quotations" | "orders">("overview");
  const [newProject, setNewProject] = useState(false);
  const [toast, setToast] = useState("");
  const embedded = useSyncExternalStore(subscribeToLocation, readEmbeddedMode, readServerEmbeddedMode);
  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(""), 2500); };
  const openProject = (p: Project, initialTab: "overview" | "samples" | "quotations" | "orders" = "overview") => { setProjectTab(initialTab); setActiveProject(p); setView("detail"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openSample = (id: string) => { setActiveSampleId(id); setView("sample-detail"); window.scrollTo({ top: 0 }); };
  const openQuotation = (id: string) => { setActiveQuotationId(id); setView("quotation-detail"); window.scrollTo({ top: 0 }); };
  const openOrder = (id: string) => { setActiveOrderId(id); setView("order-detail"); window.scrollTo({ top: 0 }); };
  const openProduct = (id: string) => { setProductReturnView(view); setActiveProductId(id); setView("product-detail"); window.scrollTo({ top: 0 }); };
  const activeSample = sampleWorkspace.samples.find((sample) => sample.id === activeSampleId);
  const activeQuotation = quotationWorkspace.quotations.find((quotation) => quotation.id === activeQuotationId);
  const activeOrder = orderWorkspace.orders.find((order) => order.id === activeOrderId);
  const sampleClient = clients.find((client) => client.id === sampleClientId);
  const updateStage = (stage: Stage) => {
    setActiveProject((p) => ({ ...p, stage }));
    setProjects((all) => all.map((p) => p.id === activeProject.id ? { ...p, stage } : p));
    showToast(t("toast.stageUpdated", { stage: label(stage) }));
  };
  const activeNav: WorkspaceView = view === "detail" ? "projects" : view === "product-detail" ? "products" : view === "sample-detail" ? "samples" : view === "quotation-detail" ? "quotations" : view === "order-detail" ? "orders" : view;
  const title = useMemo(() => { const item = workspaceNavigation.find((entry) => entry.id === activeNav); return item ? t(item.key) : t("nav.dashboard"); }, [activeNav, t]);
  const isPlaceholder = view !== "detail" && view !== "product-detail" && view !== "sample-detail" && view !== "quotation-detail" && view !== "order-detail" && placeholderViews.has(view) && !(view === "clients" && sampleClient);
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
    const context = getSampleContext(sample, sampleWorkspace, projects);
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
    const approved = candidates.find((item) => getSampleReadiness(getSampleContext(item, sampleWorkspace, projects)).ready);
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
    const result = createOrderFromQuote(quotation, orderWorkspace, projects);
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
        todoCount={mockTasks.filter((task) => task.status !== "已完成").length}
        onNavigate={setView}
        onLanguageChange={changeLanguage}
        onGlobalCreate={handleGlobalCreate}
      >
          {view === "dashboard" && <DashboardView projects={projects} onOpenProject={openProject} onNavigate={setView} onOpenNewProject={() => setNewProject(true)} />}
          {view === "projects" && <Projects projects={projects} openProject={openProject} openNew={() => setNewProject(true)} />}
          {view === "products" && <ProductLibrary data={productLibrary} onOpen={openProduct} />}
          {view === "product-detail" && activeProductId && <ProductLibraryDetail key={activeProductId} data={productLibrary} productId={activeProductId} onBack={() => setView(productReturnView === "product-detail" ? "products" : productReturnView)} onAdd={(id, variantId) => setProductToAdd({ id, variantId })} />}
          {view === "detail" && <ProjectDetail project={activeProject} onBack={() => setView("projects")} updateStage={updateStage} showToast={showToast} sampleWorkspace={sampleWorkspace} quotationWorkspace={quotationWorkspace} orderWorkspace={orderWorkspace} productLibrary={productLibrary} onBrowseProducts={() => setView("products")} onOpenProduct={openProduct} onOpenSample={openSample} onOpenQuotation={openQuotation} onCreateQuotation={() => createForProject(activeProject)} onOpenOrder={openOrder} language={language} initialTab={projectTab} />}
          {view === "samples" && <SampleCenter workspace={sampleWorkspace} projects={projects} onOpenSample={openSample} language={language} />}
          {view === "sample-detail" && activeSample && <SampleDetail key={activeSample.id} context={getSampleContext(activeSample, sampleWorkspace, projects)} language={language} dispatch={dispatchSample} onBack={() => setView("samples")} onProject={() => { const p = projects.find((project) => project.id === activeSample.projectId); if (p) openProject(p, "samples"); }} onClient={() => { setSampleClientId(activeSample.clientId); setView("clients"); window.scrollTo({ top: 0 }); }} onCreateQuotation={() => createOrOpenQuotation(activeSample.id)} showToast={showToast} />}
          {view === "quotations" && <QuotationCenter workspace={quotationWorkspace} projects={projects} language={language} onOpenQuotation={openQuotation} onCreate={() => createForProject(activeProject)} />}
          {view === "quotation-detail" && activeQuotation && <QuotationDetail key={activeQuotation.id} context={getQuotationContext(activeQuotation, quotationWorkspace, projects)} language={language} dispatch={dispatchQuotation} onBack={() => setView("quotations")} onProject={() => { const p = projects.find((project) => project.id === activeQuotation.projectId); if (p) openProject(p, "quotations"); }} onSample={openSample} onOpenVersion={openQuotation} onCreatePO={() => createOrOpenOrder(activeQuotation.id)} showToast={showToast} />}
          {view === "orders" && <OrderCenter workspace={orderWorkspace} quotationWorkspace={quotationWorkspace} projects={projects} language={language} onOpenOrder={openOrder} />}
          {view === "order-detail" && activeOrder && <OrderDetail key={activeOrder.id} context={getOrderContext(activeOrder, orderWorkspace, quotationWorkspace, projects)} language={language} dispatch={dispatchOrder} onBack={() => setView("orders")} onClient={() => { setSampleClientId(activeOrder.clientId); setView("clients"); window.scrollTo({ top: 0 }); }} onProject={() => { const p = projects.find((project) => project.id === activeOrder.projectId); if (p) openProject(p, "orders"); }} onQuotation={() => openQuotation(activeOrder.quotationId)} showToast={showToast} />}
          {view === "clients" && sampleClient && <div className="sample-workspace"><button className="back-link" onClick={() => activeSampleId ? openSample(activeSampleId) : setView("samples")}>‹ {t("sample.back")}</button><PageHeader title={text(sampleClient.name)} subtitle={`${sampleClient.code} · ${text(sampleClient.country)} · ${text(sampleClient.region)}`} /><Card className="sample-section"><div className="sample-section-head"><h2>{t("client.reference")}</h2><Badge>{label(sampleClient.type)}</Badge></div><p className="sample-resource-note">{t("client.preview")}</p><div className="sample-client-projects">{projects.filter((project) => project.clientId === sampleClient.id).map((project) => <button key={project.id} onClick={() => openProject(project, "samples")}><strong>{project.code} · {text(project.name)}</strong><span>{t("client.viewProject")} →</span></button>)}</div></Card></div>}
          {view === "todos" && <Todos showToast={showToast} />}
          {view === "reports" && <Reports showToast={showToast} />}
          {view === "ai" && <><PageHeader title={t("ai.title")} subtitle={language === "zh" ? `当前关联项目：${activeProject.code} · ${activeProject.name}` : `Current project: ${activeProject.code} · ${label(activeProject.name)}`} /><AIAssistant project={activeProject} showToast={showToast} /></>}
          {(view === "templates" || view === "settings") && <SimplePage type={view} />}
          {isPlaceholder && <EmptyState title={title} description={t("errors.modulePending")} />}
      </WorkspaceShell>
      {newProject && <NewProjectModal onClose={() => setNewProject(false)} onCreate={(p) => { setProjects((x) => [p, ...x]); setNewProject(false); showToast(t("toast.projectCreated")); openProject(p); }} />}
      {productToAdd && getProductById(productLibrary, productToAdd.id) && <AddProductToProjectDialog product={getProductById(productLibrary, productToAdd.id)!} variants={getVariantsForProduct(productLibrary, productToAdd.id)} projects={projects} initialVariantId={productToAdd.variantId} onAdd={addCurrentProduct} onClose={() => setProductToAdd(null)} />}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </>
  );
}
