"use client";

import "../components/samples/sample-workspace.css";
import "../components/quotations/quotation-workspace.css";
import "../components/orders/order-workspace.css";
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
import { createOrderFromQuote, createOrderWorkspace, getOrderContext, orderWorkspaceReducer } from "../components/orders/order-data";
import type { OrderWorkspace } from "../components/orders/order-data";
import { Badge, Button, Card, Modal } from "../components/ui/primitives";
import {
  projects as initialProjects,
  clients,
  projectStages as stages,
  tasks as mockTasks,
} from "../lib/mock-data";
import type { Project, ProjectStage as Stage } from "../lib/mock-data";

type OutputLanguage = "中文" | "英文" | "中英对照";
type View = WorkspaceView | "detail" | "sample-detail" | "quotation-detail" | "order-detail";

const placeholderViews = new Set<WorkspaceView>(["clients", "fulfillment"]);

const aiPrompts = ["总结当前项目", "还有哪些信息待确认？", "生成下一步行动", "生成客户英文回复", "生成内部中文任务单", "生成项目周报", "准备价格谈判方案", "当前项目有哪些风险？"];

const aiContent: Record<string, { title: string; zh: string; en: string }> = {
  总结当前项目: {
    title: "项目状态摘要",
    zh: "项目处于打样阶段。第二版防水拉链样品已于今日签收，客户将优先测试 64 cm 黑色款。主要规格已基本确认，但定制 Logo、目标价格及洗后防水测试标准仍待确认。整体进度正常，建议在 7 月 30 日前主动跟进测试安排。",
    en: "The project is in sampling. The second waterproof zipper sample set was received today, and the client will prioritize the 64 cm black version. Most specifications are confirmed, while the custom logo, target price and post-wash water-repellency standard remain open.",
  },
  "还有哪些信息待确认？": {
    title: "待确认信息清单",
    zh: "1. 拉片定制 Logo 的最终图稿与雕刻位置\n2. 客户可接受的目标价格区间\n3. AATCC 22 测试应以 3 次还是 5 次水洗为准\n4. 首批订单中各长度的数量比例\n5. 大货包装与条码要求",
    en: "1. Final custom logo artwork and engraving position\n2. Acceptable target price range\n3. Whether AATCC 22 applies after 3 or 5 wash cycles\n4. Quantity split by zipper length\n5. Bulk packaging and barcode requirements",
  },
  生成下一步行动: {
    title: "建议下一步行动",
    zh: "优先级 P1｜7 月 30 日前通过邮件确认客户的测试计划及反馈日期。\n优先级 P1｜请技术部书面说明水洗 3 次与 5 次后的性能差异。\n优先级 P2｜向客户索取 Logo 矢量文件及各长度的数量占比。\n优先级 P2｜按 80K / 120K / 200K 三档数量准备阶梯报价。",
    en: "P1 | Confirm the client's testing schedule and feedback date by July 30.\nP1 | Ask the technical team to document the performance difference after 3 vs. 5 washes.\nP2 | Request vector logo artwork and the quantity split by length.\nP2 | Prepare tiered pricing for 80K / 120K / 200K units.",
  },
  生成客户英文回复: {
    title: "客户英文回复草稿",
    zh: "Dear Olivia,\n\nThank you for confirming receipt of the V2 samples. We understand that your team will test the 64 cm black zipper first. Could you please share your expected testing schedule and confirm whether the water-repellency rating should be assessed after three or five wash cycles?\n\nOur technical team is ready to support you if any questions arise during testing.\n\nBest regards,\nChen",
    en: "Dear Olivia,\n\nThank you for confirming receipt of the V2 samples. We understand that your team will test the 64 cm black zipper first. Could you please share your expected testing schedule and confirm whether the water-repellency rating should be assessed after three or five wash cycles?\n\nOur technical team is ready to support you if any questions arise during testing.\n\nBest regards,\nChen",
  },
  生成内部中文任务单: {
    title: "内部跟进任务单",
    zh: "项目：NAS-2407 防水拉链开发\n负责人：陈晨\n协作：技术部、报价组\n截止：2026-07-30\n\n• 技术部：确认 3/5 次水洗测试差异并提供数据\n• 报价组：准备 80K/120K/200K 阶梯报价\n• 销售：跟进客户测试日程、Logo 文件及数量占比",
    en: "Internal task sheet created for the sales, technical and quotation teams. Key deadline: July 30, 2026.",
  },
  生成项目周报: {
    title: "本周项目周报",
    zh: "本周完成：完成 V2 样品制作，样品已寄达客户。\n客户反馈：将优先测试 64 cm 黑色样品。\n当前风险：双方对水洗次数的测试要求尚未统一。\n下周计划：取得初步测试反馈，确认 Logo 文件及目标价格，完成阶梯报价。",
    en: "Completed this week: V2 samples produced and delivered.\nClient feedback: The 64 cm black sample will be tested first.\nCurrent risk: Misalignment on post-wash test cycles.\nNext week: Obtain initial test feedback, confirm logo artwork and target price, and complete tiered pricing.",
  },
  准备价格谈判方案: {
    title: "价格谈判准备",
    zh: "建议守价区间：USD 0.86–0.91 / 条；目标成交价为 USD 0.88。\n可交换条件：年采购量达到 200K、采用统一规格包装、使用标准色且不另行调色。\n不宜轻易让步：定制模具费、专项测试费、低于 80K 的小单附加费。\n沟通策略：先确认年采购量、需求预测准确度及付款条件，再讨论降价幅度。",
    en: "Suggested range: USD 0.86–0.91 per piece; target close at USD 0.88. Trade concessions for 200K annual volume, standardized packaging and standard colors. Protect tooling, special testing and small-order surcharges.",
  },
  "当前项目有哪些风险？": {
    title: "项目风险扫描",
    zh: "中风险｜测试标准存在冲突，可能需要重新打样，并造成 7–10 天延期。\n中风险｜目标价格尚未确认，测试通过后可能出现较大价差。\n低风险｜Logo 图稿尚未提供，目前不影响功能样测试。\n建议：本周内书面确认测试标准，并提前提供价格区间。",
    en: "Medium: Conflicting test standards may trigger resampling and a 7–10 day delay.\nMedium: The target price is still unconfirmed.\nLow: Logo artwork is pending but does not block functional testing.\nRecommendation: confirm the test standard in writing this week and share a preliminary price range.",
  },
};

const subscribeToLocation = () => () => undefined;
const readEmbeddedMode = () => new URLSearchParams(window.location.search).get("embedded") === "true";
const readServerEmbeddedMode = () => false;

function Projects({ projects, openProject, openNew }: { projects: Project[]; openProject: (p: Project) => void; openNew: () => void }) {
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
      <PageHeader title="客户项目" subtitle="集中管理询盘、需求、样品、报价与客户沟通。" actions={<Button onClick={openNew}>＋ 新建项目</Button>} />
      <Card className="filters">
        <label className="searchbox"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索项目名称、客户或项目编号..." /></label>
        <select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="销售阶段筛选">
          <option>全部阶段</option>{stages.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select value={product} onChange={(e) => setProduct(e.target.value)} aria-label="产品类别筛选">
          <option>全部产品</option><option>拉链</option><option>纽扣</option><option>绳扣</option><option>织带</option>
        </select>
        <span className="filter-count">找到 {filtered.length} 个项目</span>
      </Card>
      <div className="project-grid">
        {filtered.map((p) => (
          <button className="project-card card" key={p.id} onClick={() => openProject(p)}>
            <div className="project-top">
              <span className="client-avatar large" style={{ background: p.color }}>{p.initials}</span>
              <div><span className="project-code">{p.code}</span><h3>{p.name}</h3></div>
              <HealthBadge status={p.health} className="health" showDot={false} />
            </div>
            <div className="project-client"><span>客户 / Client</span><strong>{p.customer}</strong><small>{p.region}</small></div>
            <div className="project-tags"><StatusBadge status={p.stage} /><Badge>{p.product}</Badge></div>
            <div className="project-progress"><span>最新进展</span><p>{p.progress}</p></div>
            <div className="next-action"><span>→</span><div><small>下一步行动</small><strong>{p.next}</strong></div></div>
            <div className="project-footer"><span>负责人 · {p.owner}</span><span>{p.updated} 更新　›</span></div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <Card className="empty-state"><span>⌕</span><h3>没有匹配的项目</h3><p>请调整关键词或筛选条件后重试。</p></Card>}
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
  const [language, setLanguage] = useState<OutputLanguage>("中文");
  const [answers, setAnswers] = useState<AssistantAnswer[]>([
    {
      id: "initial",
      title: `${project.code} 项目材料`,
      answer: `${project.name}\n当前阶段：${project.stage}\n最新进展：${project.progress}\n下一步行动：${project.next}`,
      mode: "mock",
      status: "partially_confirmed",
      evidence: ["project_profile"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ask = async (prompt: string) => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setInput("");
    try {
      const response = await fetch("/api/project-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, question: prompt, language }),
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
        ? language === "中文"
          ? fallback.zh
          : language === "英文"
            ? fallback.en
            : `${fallback.zh}\n\n— English —\n${fallback.en}`
        : language === "英文"
          ? "This information has not yet been confirmed in the current project materials."
          : "当前项目材料中尚未确认";
      setAnswers((current) => [
        {
          id: `${Date.now()}`,
          title: fallback?.title ?? "信息尚未确认",
          answer: fallbackText,
          mode: "mock",
          status: fallback ? "partially_confirmed" : "not_confirmed",
          evidence: [],
        },
        ...current,
      ]);
      showToast("已切换至模拟 AI 模式");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="ai-layout">
      <aside className="prompt-panel card"><div className="prompt-title"><span className="sparkle">✦</span><div><h2>项目 AI 助手</h2><p>仅基于当前项目材料回答</p></div></div><div className="language-control"><span>输出语言</span><div>{(["中文", "英文", "中英对照"] as OutputLanguage[]).map((l) => <button className={language === l ? "active" : ""} key={l} onClick={() => setLanguage(l)}>{l}</button>)}</div></div><span className="prompt-label">快捷问题</span>{aiPrompts.map((p) => <button className="prompt-button" disabled={loading} key={p} onClick={() => void ask(p)}><span>✦</span>{p}<b>›</b></button>)}</aside>
      <div className="chat-panel card">
        <div className="chat-head"><div><h2>{project.code} 项目对话</h2><p><span className="online-dot" /> 项目材料已就绪 · 自动保留无 Key 模拟模式</p></div><button className="icon-btn">⋯</button></div>
        <div className="chat-scroll">
          {loading && <div className="ai-loading"><span className="online-dot" />正在根据当前项目材料整理回答…</div>}
          {answers.map((item) => <div className="ai-answer" key={item.id}><div className="answer-meta"><span className="sparkle small-sparkle">✦</span><div><strong>{item.title}</strong><small>TrimFlow AI · {item.mode === "live" ? "OpenAI 实时回答" : "模拟回答"}</small></div><div className="answer-actions"><button onClick={() => { void navigator.clipboard?.writeText(item.answer).catch(() => undefined); showToast("内容已复制"); }}>复制</button><button onClick={() => void ask(item.title)}>重新生成</button></div></div><div className="answer-content">{item.answer}</div><div className={`prototype-note ${item.mode === "live" ? "live-note" : ""}`}>{item.mode === "live" ? "✓ 回答仅依据当前项目材料，并已通过结构化 JSON 校验。" : "ⓘ 当前为模拟 AI 模式；配置服务器端 API Key 后将自动使用 OpenAI。"}</div></div>)}
        </div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); void ask(input); }}><textarea value={input} disabled={loading} onChange={(e) => setInput(e.target.value)} placeholder="询问关于此项目的任何问题..." rows={2} /><div><span>AI 仅参考当前项目的需求、沟通、样品和报价材料</span><Button type="submit" disabled={loading}>{loading ? "生成中…" : "发送　↑"}</Button></div></form>
      </div>
    </div>
  );
}

function Todos({ showToast }: { showToast: (s: string) => void }) {
  const [done, setDone] = useState<number[]>([3]);
  const tasks = [
    ["P1", "跟进 NAS-2407 样品测试安排", "North American Sportswear Brand", "今天 10:30", "陈晨"],
    ["P1", "完成 EFC-2411 测试费与模具费说明", "European Fashion Client", "今天 14:00", "王璐"],
    ["P2", "发送瑜伽系列产品规格确认表", "Emerging Yoga Wear Brand", "今天 17:00", "林薇"],
    ["P2", "整理户外客户的三档数量报价", "Outdoor Clothing Client", "明天", "陈晨"],
    ["P3", "更新本周项目周报", "全部项目", "周五 16:00", "陈晨"],
  ];
  return <><PageHeader title="待办事项" subtitle="聚焦今天最重要的客户跟进与内部协作。" actions={<Button>＋ 添加待办</Button>} /><div className="todo-summary"><Card><span>今天到期</span><strong>3</strong></Card><Card><span>本周待办</span><strong>9</strong></Card><Card><span>已完成</span><strong>6</strong></Card><Card><span>已逾期</span><strong className="red-text">1</strong></Card></div><Card><div className="card-head"><div><h2>我的待办</h2><p>按优先级与截止时间排序</p></div><div className="segment"><button className="active">全部</button><button>今天</button><button>本周</button></div></div><div className="task-list">{tasks.map(([p, task, client, due, owner], i) => <div className={`task-row ${done.includes(i) ? "task-done" : ""}`} key={task}><button className="task-check" onClick={() => { setDone((x) => x.includes(i) ? x.filter((n) => n !== i) : [...x, i]); showToast(done.includes(i) ? "已恢复待办" : "待办已完成"); }}>{done.includes(i) ? "✓" : ""}</button><span className={p === "P1" ? "priority p1" : "priority"}>{p}</span><div className="task-main"><strong>{task}</strong><small>{client}</small></div><span>{owner}</span><Badge tone={due.includes("今天") ? "red" : "neutral"}>{due}</Badge><button className="icon-btn">⋯</button></div>)}</div></Card></>;
}

function Reports({ showToast }: { showToast: (s: string) => void }) {
  const [language, setLanguage] = useState<OutputLanguage>("中文");
  const sections = [
    ["本周完成事项", "完成 V2 防水拉链样品制作并于 7 月 24 日寄出；客户已签收。"],
    ["客户最新反馈", "客户将优先测试 64 cm 黑色款，预计本周四提供初步结果。"],
    ["产品与样品进展", "膜面光泽与灰色色差已按 V1 反馈调整，V2 进入客户测试。"],
    ["报价与谈判进展", "正在准备 80K / 120K / 200K 三档模拟报价，基础参考价为 USD 0.88 / 条。"],
    ["当前风险", "客户与技术部对洗后测试次数的口径不一致，可能影响成本与交期。"],
    ["待解决问题", "确认测试标准、Logo 图稿、目标价格及各长度数量占比。"],
    ["下周行动计划", "取得测试反馈；完成阶梯报价；推进 Logo 与包装要求确认。"],
    ["需要管理层支持的事项", "如客户坚持 5 次水洗标准，需技术总监确认新膜材方案与价格底线。"],
  ];
  return <><PageHeader title="周报中心" subtitle="将分散的客户进展整理为结构化销售周报。" actions={<span className="week-picker">‹　2026 年 7 月 27 日 – 8 月 2 日　›</span>} /><div className="report-toolbar card"><div><span>生成语言</span><div className="segment">{(["中文", "英文", "中英对照"] as OutputLanguage[]).map((x) => <button key={x} className={language === x ? "active" : ""} onClick={() => setLanguage(x)}>{x}</button>)}</div></div><div className="page-actions"><Button variant="secondary" onClick={() => showToast("周报内容已复制")}>复制内容</Button><Button variant="secondary" onClick={() => showToast("原型模式：已模拟导出 Markdown")}>导出 Markdown</Button><Button onClick={() => showToast(`${language}周报已重新生成`)}>✦ 重新生成</Button></div></div><div className="report-grid">{initialProjects.slice(0, 3).map((p, idx) => <Card className="report-card" key={p.id}><div className="report-card-head"><div className="detail-title"><span className="client-avatar" style={{ background: p.color }}>{p.initials}</span><div><span className="project-code">{p.code}</span><h2>{p.name}</h2><p>{p.customer}</p></div></div><StatusBadge status={p.stage} /></div><div className="report-sections">{sections.map(([title, body], sidx) => <div key={title}><strong>{title}</strong><p>{idx === 1 && sidx === 0 ? "已提交 V2 阶梯报价，并补充报价有效期说明。" : idx === 2 && sidx === 0 ? "已整理客户概念板和初步产品组合。" : body}</p></div>)}</div><div className="report-footer"><span>✦ 模拟 AI 生成 · 刚刚更新</span><div><button onClick={() => showToast("周报内容已复制")}>复制</button><button>编辑</button></div></div></Card>)}</div></>;
}

function SimplePage({ type }: { type: "templates" | "settings" }) {
  if (type === "templates") return <><PageHeader title="模板中心" subtitle="沉淀高频外贸沟通与项目管理模板。" actions={<Button>＋ 新建模板</Button>} /><div className="template-grid">{[["✉","样品寄出通知","英文邮件","告知客户样品版本、物流单号和预计签收时间。"],["¥","报价跟进邮件","英文邮件","报价发出后 3–5 天的礼貌跟进模板。"],["▤","销售项目周报","内部报告","结构化汇总客户、样品、报价、风险与行动。"],["✓","新品开发任务单","内部协作","将客户需求拆解为技术、采购和销售任务。"],["!","价格谈判清单","谈判准备","整理守价区间、交换条件与不可让步项。"],["◈","样品反馈表","中英对照","快速记录外观、功能、颜色与测试反馈。"]].map(([icon,title,type,desc])=><Card className="template-card" key={title}><span className="template-icon">{icon}</span><Badge>{type}</Badge><h2>{title}</h2><p>{desc}</p><Button variant="secondary">使用模板</Button></Card>)}</div></>;
  return <><PageHeader title="设置" subtitle="管理工作区偏好与原型展示选项。" /><div className="settings-layout"><Card><div className="card-head"><div><h2>工作区设置</h2><p>这些选项仅保存在当前原型会话中</p></div></div><div className="settings-list"><label><div><strong>默认界面语言</strong><span>页面菜单与基础业务文案</span></div><select><option>简体中文</option><option>English</option></select></label><label><div><strong>AI 默认输出语言</strong><span>邮件、周报与任务单的生成语言</span></div><select><option>中文</option><option>英文</option><option>中英对照</option></select></label><label><div><strong>默认币种</strong><span>新建报价时预选的币种</span></div><select><option>USD</option><option>EUR</option><option>CNY</option></select></label><label><div><strong>项目风险提醒</strong><span>在工作台突出显示需要关注的项目</span></div><button className="switch active"><span /></button></label></div></Card><Card className="prototype-card"><span className="sparkle">✦</span><h2>TrimFlow AI 网页原型</h2><p>当前版本仅用于展示完整业务流程。所有客户、价格、邮件、物流和 AI 结果均为模拟数据。</p><Badge tone="blue">原型版本 v0.1</Badge></Card></div></>;
}

function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Project) => void }) {
  return <Modal title="新建客户项目" onClose={onClose}><form className="modal-form" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const id = Date.now(); const customer = String(f.get("customer")); onCreate({ id, clientId: `client-new-${id}`, code: `NEW-${String(id).slice(-4)}`, name: String(f.get("name")), customer, region: String(f.get("region")), product: String(f.get("product")), stage: String(f.get("stage")) as Stage, lifecycleStage: "inquiry", progress: "项目已创建，等待整理初始客户询盘", owner: String(f.get("owner")), next: "梳理客户询盘并确认缺失信息", updated: "刚刚", lastUpdatedAt: new Date(id).toISOString(), quantity: String(f.get("quantity") || "待确认"), delivery: String(f.get("delivery") || "待确认"), health: "良好", contact: String(f.get("contact") || "待补充"), email: "待补充", initials: "NP", color: "#285c72", currentSummary: "新项目已创建，当前处于询盘整理阶段。", confirmedInformation: [customer], pendingInformation: ["客户需求与产品规格待整理"], risks: [], nextActions: ["梳理客户询盘并确认缺失信息"] }); }}>
    <div className="form-row"><label>项目名称 / Project Name<input name="name" required placeholder="例如：户外品牌——防水拉链项目" /></label><label>客户名称或代号 / Client Name or Code<input name="customer" required placeholder="请使用匿名或虚构名称" /></label></div>
    <div className="form-row"><label>国家或地区 / Country or Region<input name="region" required placeholder="例如：加拿大 · 温哥华" /></label><label>联系人 / Contact<input name="contact" placeholder="姓名与职位" /></label></div>
    <div className="form-row"><label>产品类型 / Product Type<select name="product"><option>防水尼龙拉链</option><option>金属拉链</option><option>金属纽扣</option><option>树脂纽扣</option><option>绳扣与织带</option><option>其他服装辅料</option></select></label><label>当前销售阶段 / Sales Stage<select name="stage">{stages.map((s) => <option key={s}>{s}</option>)}</select></label></div>
    <div className="form-row"><label>负责人 / Owner<select name="owner"><option>陈晨</option><option>王璐</option><option>林薇</option></select></label><label>预计数量 / Estimated Quantity<input name="quantity" placeholder="例如：80,000 条 / 年" /></label></div>
    <label>目标交期 / Target Delivery Date<input name="delivery" type="date" /></label><label>初始客户询盘 / Initial Inquiry<textarea rows={4} placeholder="粘贴客户英文询盘内容..." /></label><label>备注 / Notes<textarea rows={2} placeholder="内部背景、注意事项或已知风险..." /></label>
    <div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose}>取消</Button><Button type="submit">创建项目</Button></div>
  </form></Modal>;
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [projects, setProjects] = useState(initialProjects);
  const [activeProject, setActiveProject] = useState<Project>(initialProjects[0]);
  const [sampleWorkspace, dispatchSample] = useReducer(sampleWorkspaceReducer, undefined, createSampleWorkspace);
  const [quotationWorkspace, dispatchQuotation] = useReducer(quotationWorkspaceReducer, undefined, createQuotationWorkspace);
  const [orderWorkspace, dispatchOrder] = useReducer(orderWorkspaceReducer, undefined, createOrderWorkspace);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [activeQuotationId, setActiveQuotationId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [sampleClientId, setSampleClientId] = useState<string | null>(null);
  const [projectTab, setProjectTab] = useState<"overview" | "samples" | "quotations" | "orders">("overview");
  const [language, setLanguage] = useState<InterfaceLanguage>("中文");
  const [newProject, setNewProject] = useState(false);
  const [toast, setToast] = useState("");
  const embedded = useSyncExternalStore(subscribeToLocation, readEmbeddedMode, readServerEmbeddedMode);
  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(""), 2500); };
  const openProject = (p: Project, initialTab: "overview" | "samples" | "quotations" | "orders" = "overview") => { setProjectTab(initialTab); setActiveProject(p); setView("detail"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openSample = (id: string) => { setActiveSampleId(id); setView("sample-detail"); window.scrollTo({ top: 0 }); };
  const openQuotation = (id: string) => { setActiveQuotationId(id); setView("quotation-detail"); window.scrollTo({ top: 0 }); };
  const openOrder = (id: string) => { setActiveOrderId(id); setView("order-detail"); window.scrollTo({ top: 0 }); };
  const activeSample = sampleWorkspace.samples.find((sample) => sample.id === activeSampleId);
  const activeQuotation = quotationWorkspace.quotations.find((quotation) => quotation.id === activeQuotationId);
  const activeOrder = orderWorkspace.orders.find((order) => order.id === activeOrderId);
  const sampleClient = clients.find((client) => client.id === sampleClientId);
  const updateStage = (stage: Stage) => {
    setActiveProject((p) => ({ ...p, stage }));
    setProjects((all) => all.map((p) => p.id === activeProject.id ? { ...p, stage } : p));
    showToast(`项目阶段已更新为“${stage}”`);
  };
  const activeNav: WorkspaceView = view === "detail" ? "projects" : view === "sample-detail" ? "samples" : view === "quotation-detail" ? "quotations" : view === "order-detail" ? "orders" : view;
  const title = useMemo(() => workspaceNavigation.find((item) => item.id === activeNav)?.label || "工作台", [activeNav]);
  const isPlaceholder = view !== "detail" && view !== "sample-detail" && view !== "quotation-detail" && view !== "order-detail" && placeholderViews.has(view) && !(view === "clients" && sampleClient);
  const createOrOpenQuotation = (sampleId: string) => {
    const sample = sampleWorkspace.samples.find((item) => item.id === sampleId);
    if (!sample) return;
    const context = getSampleContext(sample, sampleWorkspace, projects);
    const result = createDraftFromSample(context, quotationWorkspace);
    if ("existing" in result && result.existing) {
      openQuotation(result.existing.id);
      showToast("该项目产品已有报价，已打开最新版本");
      return;
    }
    if (!getSampleReadiness(context).ready) {
      showToast("当前样品尚未满足报价交接条件");
      return;
    }
    dispatchQuotation({ type: "create", quotation: result.quotation, tiers: result.tiers });
    setActiveQuotationId(result.quotation.id);
    setView("quotation-detail");
    window.scrollTo({ top: 0 });
    showToast("已从确认样创建报价草稿 · Demo Workspace");
  };
  const createForProject = (project: Project) => {
    const candidates = sampleWorkspace.samples.filter((item) => item.projectId === project.id);
    const approved = candidates.find((item) => getSampleReadiness(getSampleContext(item, sampleWorkspace, projects)).ready);
    if (approved) createOrOpenQuotation(approved.id);
    else {
      setView("quotations");
      showToast("该项目尚无满足报价交接条件的确认样");
    }
  };
  const createOrOpenOrder = (quotationId: string) => {
    const quotation = quotationWorkspace.quotations.find((item) => item.id === quotationId);
    if (!quotation) {
      showToast("未找到关联报价，无法创建采购订单");
      return;
    }
    const result = createOrderFromQuote(quotation, orderWorkspace, projects);
    if ("existing" in result && result.existing) {
      openOrder(result.existing.id);
      showToast("该报价已关联采购订单，已打开现有订单");
      return;
    }
    if ("blocked" in result && result.blocked) {
      showToast("只有已接受的报价才能创建采购订单");
      return;
    }
    dispatchOrder({ type: "create", order: result.order, lines: result.lines, contract: result.contract, delivery: result.delivery, shipment: result.shipment });
    setActiveOrderId(result.order.id);
    setView("order-detail");
    window.scrollTo({ top: 0 });
    showToast("已从 Accepted Quotation 创建演示采购订单");
  };
  const changeLanguage = (nextLanguage: InterfaceLanguage) => {
    setLanguage(nextLanguage);
    showToast(nextLanguage === "中文" ? "界面语言已切换为中文" : "Language switched to English");
  };
  const handleGlobalCreate = (type: GlobalCreateType) => {
    if (type === "project") {
      setNewProject(true);
      return;
    }
    if (type === "sample") {
      setView("samples");
      showToast("样品开发中心已打开；选择样品可发起后续版本开发");
      return;
    }
    if (type === "quotation") {
      setView("quotations");
      showToast("报价中心已打开；请从确认样或项目创建报价");
      return;
    }
    if (type === "task") setView("todos");
    const labels: Record<"quotation" | "task", string> = { quotation: "报价", task: "待办" };
    showToast(`${labels[type]}新建入口已打开；完整流程将在后续步骤实现`);
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
          {view === "detail" && <ProjectDetail project={activeProject} onBack={() => setView("projects")} updateStage={updateStage} showToast={showToast} sampleWorkspace={sampleWorkspace} quotationWorkspace={quotationWorkspace} orderWorkspace={orderWorkspace} onOpenSample={openSample} onOpenQuotation={openQuotation} onCreateQuotation={() => createForProject(activeProject)} onOpenOrder={openOrder} language={language} initialTab={projectTab} />}
          {view === "samples" && <SampleCenter workspace={sampleWorkspace} projects={projects} onOpenSample={openSample} language={language} />}
          {view === "sample-detail" && activeSample && <SampleDetail key={activeSample.id} context={getSampleContext(activeSample, sampleWorkspace, projects)} language={language} dispatch={dispatchSample} onBack={() => setView("samples")} onProject={() => { const p = projects.find((project) => project.id === activeSample.projectId); if (p) openProject(p, "samples"); }} onClient={() => { setSampleClientId(activeSample.clientId); setView("clients"); window.scrollTo({ top: 0 }); }} onCreateQuotation={() => createOrOpenQuotation(activeSample.id)} showToast={showToast} />}
          {view === "quotations" && <QuotationCenter workspace={quotationWorkspace} projects={projects} language={language} onOpenQuotation={openQuotation} onCreate={() => createForProject(activeProject)} />}
          {view === "quotation-detail" && activeQuotation && <QuotationDetail key={activeQuotation.id} context={getQuotationContext(activeQuotation, quotationWorkspace, projects)} language={language} dispatch={dispatchQuotation} onBack={() => setView("quotations")} onProject={() => { const p = projects.find((project) => project.id === activeQuotation.projectId); if (p) openProject(p, "quotations"); }} onSample={openSample} onOpenVersion={openQuotation} onCreatePO={() => createOrOpenOrder(activeQuotation.id)} showToast={showToast} />}
          {view === "orders" && <OrderCenter workspace={orderWorkspace} quotationWorkspace={quotationWorkspace} projects={projects} language={language} onOpenOrder={openOrder} />}
          {view === "order-detail" && activeOrder && <OrderDetail key={activeOrder.id} context={getOrderContext(activeOrder, orderWorkspace, quotationWorkspace, projects)} language={language} dispatch={dispatchOrder} onBack={() => setView("orders")} onClient={() => { setSampleClientId(activeOrder.clientId); setView("clients"); window.scrollTo({ top: 0 }); }} onProject={() => { const p = projects.find((project) => project.id === activeOrder.projectId); if (p) openProject(p, "orders"); }} onQuotation={() => openQuotation(activeOrder.quotationId)} showToast={showToast} />}
          {view === "clients" && sampleClient && <div className="sample-workspace"><button className="back-link" onClick={() => activeSampleId ? openSample(activeSampleId) : setView("samples")}>‹ 返回样品 / Back to Sample</button><PageHeader title={sampleClient.name} subtitle={`${sampleClient.code} · ${sampleClient.country} · ${sampleClient.region}`} /><Card className="sample-section"><div className="sample-section-head"><h2>客户关联 / Client Reference</h2><Badge>{sampleClient.type}</Badge></div><p className="sample-resource-note">这是样品关联的客户资料预览；完整客户中心将在后续阶段完成。</p><div className="sample-client-projects">{projects.filter((project) => project.clientId === sampleClient.id).map((project) => <button key={project.id} onClick={() => openProject(project, "samples")}><strong>{project.code} · {project.name}</strong><span>查看项目与样品 →</span></button>)}</div></Card></div>}
          {view === "todos" && <Todos showToast={showToast} />}
          {view === "reports" && <Reports showToast={showToast} />}
          {view === "ai" && <><PageHeader title="AI 助手" subtitle={`当前关联项目：${activeProject.code} · ${activeProject.name}`} /><AIAssistant project={activeProject} showToast={showToast} /></>}
          {(view === "templates" || view === "settings") && <SimplePage type={view} />}
          {isPlaceholder && <EmptyState title={title} description="该模块将在 TrimFlow AI 2.0 第一阶段后续步骤中完成。" />}
      </WorkspaceShell>
      {newProject && <NewProjectModal onClose={() => setNewProject(false)} onCreate={(p) => { setProjects((x) => [p, ...x]); setNewProject(false); showToast("新项目已创建"); openProject(p); }} />}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </>
  );
}
