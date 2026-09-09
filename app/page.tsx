"use client";

import { FormEvent, useMemo, useState } from "react";
import { EmptyState } from "../components/business/empty-state";
import { HealthBadge } from "../components/business/health-badge";
import { StatusBadge } from "../components/business/status-badge";
import { DashboardView } from "../components/dashboard/dashboard-view";
import { PageHeader } from "../components/layout/page-header";
import { WorkspaceShell, workspaceNavigation } from "../components/layout/workspace-shell";
import type { InterfaceLanguage, WorkspaceView } from "../components/layout/workspace-shell";
import type { GlobalCreateType } from "../components/layout/workspace-shell";
import { Badge, Button, Card, Modal } from "../components/ui/primitives";
import {
  legacyActivityRows as activities,
  legacyRequirementRows as requirements,
  projects as initialProjects,
  projectStages as stages,
  tasks as mockTasks,
} from "../lib/mock-data";
import type { Project, ProjectStage as Stage } from "../lib/mock-data";

type OutputLanguage = "中文" | "英文" | "中英对照";
type View = WorkspaceView | "detail";

const placeholderViews = new Set<WorkspaceView>(["clients", "samples", "quotations", "orders", "fulfillment"]);

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
}: {
  project: Project;
  onBack: () => void;
  updateStage: (stage: Stage) => void;
  showToast: (s: string) => void;
}) {
  const [tab, setTab] = useState("项目概览");
  const [recordModal, setRecordModal] = useState(false);
  const [todoModal, setTodoModal] = useState(false);
  const [records, setRecords] = useState(activities);
  const tabs = ["项目概览", "客户资料", "产品需求", "沟通记录", "样品与报价", "AI助手"];
  const addRecord = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setRecords([{ date: "刚刚", title: String(fd.get("type")), text: String(fd.get("content")), icon: "＋" }, ...records]);
    setRecordModal(false); showToast("沟通记录已添加");
  };
  return (
    <>
      <button className="back-link" onClick={onBack}>‹ 返回客户项目</button>
      <div className="detail-head">
        <div className="detail-title">
          <span className="client-avatar xl" style={{ background: project.color }}>{project.initials}</span>
          <div><span className="project-code">{project.code}</span><h1>{project.name}</h1><p>{project.customer} · {project.region}</p></div>
        </div>
        <div className="page-actions"><Button variant="secondary" onClick={() => setTodoModal(true)}>＋ 添加待办</Button><Button onClick={() => setTab("AI助手")}>✦ 询问项目 AI</Button></div>
      </div>
      <Card className="project-facts">
        <div><span>产品类型 / Product Type</span><strong>{project.product}</strong></div>
        <div><span>销售阶段 / Sales Stage</span>
          <select value={project.stage} onChange={(e) => updateStage(e.target.value as Stage)}>{stages.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <div><span>负责人 / Owner</span><strong>{project.owner}</strong></div>
        <div><span>预计数量 / Estimated Quantity</span><strong>{project.quantity}</strong></div>
        <div><span>目标交期 / Target Delivery Date</span><strong>{project.delivery}</strong></div>
        <div><span>项目状态 / Project Health</span><HealthBadge status={project.health} className="health-inline" /></div>
      </Card>
      <div className="tabs" role="tablist">
        {tabs.map((t) => <button role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} key={t} onClick={() => setTab(t)}>{t}{t === "产品需求" && <span className="tab-alert">3</span>}</button>)}
      </div>
      {tab === "项目概览" && <Overview records={records} />}
      {tab === "客户资料" && <CustomerInfo project={project} />}
      {tab === "产品需求" && <Requirements />}
      {tab === "沟通记录" && <Communications records={records} add={() => setRecordModal(true)} />}
      {tab === "样品与报价" && <SamplesQuotes />}
      {tab === "AI助手" && <AIAssistant project={project} showToast={showToast} />}
      {recordModal && (
        <Modal title="添加沟通记录" onClose={() => setRecordModal(false)}>
          <form className="modal-form" onSubmit={addRecord}>
            <label>记录类型<select name="type"><option>客户邮件</option><option>聊天记录</option><option>电话记录</option><option>内部备注</option><option>样品反馈</option><option>报价反馈</option></select></label>
            <label>日期与时间<input type="datetime-local" defaultValue="2026-07-28T14:30" /></label>
            <label>记录内容<textarea name="content" required placeholder="粘贴邮件、聊天内容或输入内部备注..." rows={6} /></label>
            <div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setRecordModal(false)}>取消</Button><Button type="submit">保存记录</Button></div>
          </form>
        </Modal>
      )}
      {todoModal && (
        <Modal title="添加项目待办" onClose={() => setTodoModal(false)}>
          <form className="modal-form" onSubmit={(e) => { e.preventDefault(); setTodoModal(false); showToast("待办事项已创建"); }}>
            <label>待办事项<input required defaultValue="跟进客户 V2 样品测试反馈" /></label>
            <div className="form-row"><label>负责人<select><option>陈晨</option><option>王璐</option><option>林薇</option></select></label><label>截止日期<input type="date" defaultValue="2026-07-30" /></label></div>
            <label>优先级<select><option>P1 · 紧急</option><option>P2 · 重要</option><option>P3 · 常规</option></select></label>
            <div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setTodoModal(false)}>取消</Button><Button type="submit">创建待办</Button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

function Overview({ records }: { records: typeof activities }) {
  return (
    <div className="detail-layout">
      <div className="main-column">
        <Card className="ai-summary">
          <div className="card-head"><div className="title-with-icon"><span className="sparkle">✦</span><div><h2>AI 项目摘要</h2><p>根据当前项目的模拟资料整理</p></div></div><Badge tone="blue">刚刚更新</Badge></div>
          <p className="summary-lead">项目处于<strong>打样阶段</strong>。第二版防水拉链样品已于今日签收，客户将优先测试 64 cm 黑色款。多数规格已经确认，但测试标准和目标价格仍需尽快对齐。</p>
          <div className="summary-stats">
            <div><span>当前进展</span><strong>V2 样品已签收</strong><small>等待客户测试</small></div>
            <div><span>信息完整度</span><strong>8 / 11 项</strong><small>73% 已确认</small></div>
            <div><span>下一关键节点</span><strong>初步测试反馈</strong><small>预计 7 月 30 日</small></div>
          </div>
        </Card>
        <div className="two-cols">
          <Card className="list-card good-list"><div className="card-head"><h2><span>✓</span> 已确认信息</h2><Badge tone="green">8 项</Badge></div>
            {["#5 TPU 膜防水尼龙拉链", "Black C 与 Cool Gray 11 C", "长度 58 / 64 / 72 cm", "预计年用量 120,000 条"].map((x) => <div className="check-line" key={x}><span>✓</span>{x}</div>)}
          </Card>
          <Card className="list-card pending-list"><div className="card-head"><h2><span>!</span> 待确认信息</h2><Badge tone="amber">3 项</Badge></div>
            {["拉片定制 Logo 最终图稿", "可接受的目标价格区间", "3 次或 5 次水洗测试标准"].map((x) => <div className="check-line" key={x}><span>?</span>{x}</div>)}
          </Card>
        </div>
        <Card>
          <div className="card-head"><div><h2>最近活动</h2><p>邮件、样品与内部协作记录</p></div><button className="text-button">查看全部记录</button></div>
          <Timeline records={records} />
        </Card>
      </div>
      <aside className="side-column">
        <Card className="risk-card"><div className="card-head"><h2>风险提示</h2><Badge tone="amber">2 项</Badge></div>
          <div className="risk-item"><span>!</span><div><strong>测试标准存在冲突</strong><p>客户要求 5 次水洗，技术部建议按 3 次，可能造成重新打样。</p><small>中风险 · 建议本周确认</small></div></div>
          <div className="risk-item"><span>¥</span><div><strong>目标价格尚未确认</strong><p>建议在测试通过前提供初步价格区间，避免后期出现较大价差。</p><small>中风险 · 报价前处理</small></div></div>
        </Card>
        <Card className="actions-card"><div className="card-head"><h2>下一步行动</h2><span className="muted">4 项</span></div>
          {[
            ["P1", "跟进客户测试安排", "7 月 30 日 · 陈晨"],
            ["P1", "确认水洗后测试标准", "7 月 30 日 · 技术部"],
            ["P2", "索取 Logo 矢量图", "8 月 1 日 · 陈晨"],
            ["P2", "准备三档阶梯报价", "8 月 2 日 · 报价组"],
          ].map(([p, t, meta]) => <div className="action-row" key={t}><span className={p === "P1" ? "priority p1" : "priority"}>{p}</span><div><strong>{t}</strong><small>{meta}</small></div><button>○</button></div>)}
          <Button variant="secondary" className="full-button">＋ 添加行动</Button>
        </Card>
        <Card className="contact-mini"><h2>客户联系人</h2><div className="contact-person"><span className="client-avatar">OR</span><div><strong>Olivia Reed</strong><small>Product Developer</small></div></div><p>olivia.reed@example-client.com</p><p>偏好：简洁、数据导向的英文邮件</p><Button variant="secondary" className="full-button">查看客户资料</Button></Card>
      </aside>
    </div>
  );
}

function Timeline({ records }: { records: typeof activities }) {
  return <div className="timeline">{records.map((a, i) => <div className="timeline-item" key={`${a.title}-${i}`}><span className="timeline-icon">{a.icon}</span><div><span>{a.date}</span><strong>{a.title}</strong><p>{a.text}</p></div></div>)}</div>;
}

function CustomerInfo({ project }: { project: Project }) {
  const groups = [
    ["客户基本信息", [["客户名称 / Client Name", project.customer], ["国家或地区 / Country or Region", project.region], ["客户类型 / Client Type", "中型运动服装品牌 / Mid-sized activewear brand"], ["合作状态 / Relationship", "新客户 · 开发阶段"], ["常用币种 / Currency", "USD"]]],
    ["主要联系人", [["姓名 / Name", project.contact], ["邮箱 / Email", project.email], ["时区 / Time Zone", "Pacific Time (UTC−8)"], ["沟通渠道 / Channel", "Email · WhatsApp"]]],
    ["客户偏好与沟通规则", [["产品偏好 / Preference", "可持续材料、哑光外观、轻量化"], ["邮件语气 / Email Tone", "简洁、专业、数据导向"], ["回复习惯 / Response Pattern", "通常 1–2 个工作日回复"], ["注意事项 / Notes", "报价需明确测试费、模具费及有效期"]]],
  ];
  return <div className="info-grid">{groups.map(([title, rows]) => <Card key={title as string}><div className="card-head"><h2>{title as string}</h2><Button variant="ghost">编辑</Button></div><div className="info-list">{(rows as string[][]).map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div></Card>)}</div>;
}

function Requirements() {
  return (
    <Card className="table-card">
      <div className="card-head"><div><h2>结构化产品需求</h2><p>最后更新：今天 09:45 · 由陈晨整理</p></div><div className="page-actions"><Button variant="secondary">导入规格表</Button><Button>＋ 添加规格项</Button></div></div>
      <div className="requirement-progress"><div><span>信息完整度</span><strong>73%</strong></div><div className="progress-track"><span style={{ width: "73%" }} /></div><small>8 项已确认 · 2 项待确认 · 1 项有冲突</small></div>
      <div className="table-wrap"><table><colgroup><col className="field-column" /><col className="value-column" /><col className="status-column" /><col className="action-column" /></colgroup><thead><tr><th>业务字段 / Business Field</th><th>当前值 / Current Value</th><th>状态 / Status</th><th>操作 / Action</th></tr></thead><tbody>
        {requirements.map(([field, value, status]) => <tr key={field}><td><strong>{field}</strong></td><td>{value}</td><td><Badge tone={status === "已确认" ? "green" : status === "有冲突" ? "red" : "amber"}>{status}</Badge></td><td><button className="text-button">编辑</button></td></tr>)}
      </tbody></table></div>
    </Card>
  );
}

function Communications({ records, add }: { records: typeof activities; add: () => void }) {
  const expanded = [
    { type: "客户邮件", date: "今天 09:18", author: "Olivia Reed", body: "Hi Chen,\n\nWe have received the V2 samples. Our team will begin by testing the black 64 cm zipper. Could you please confirm whether the specified water-repellency rating can be maintained after five wash cycles?\n\nBest regards,\nOlivia", tone: "blue" },
    { type: "WhatsApp 聊天", date: "7 月 27 日 16:08", author: "Olivia ↔ 陈晨", body: "Olivia: The samples look good. We will share our initial test results by Thursday.\nChen: Thank you. Our technical team is ready to support you if any questions arise.", tone: "green" },
    { type: "内部备注", date: "7 月 26 日 11:32", author: "技术部 · 刘工", body: "现有配方可稳定达到水洗 3 次后防泼水等级不低于 80 分。若改为水洗 5 次，需调整膜材，预计增加 3%–5% 的成本。建议尽快与客户书面确认测试标准。", tone: "amber" },
  ];
  return <><div className="section-title"><div><h2>沟通记录</h2><p>按时间汇总客户往来与内部协作</p></div><Button onClick={add}>＋ 添加记录</Button></div><div className="communication-list">{expanded.map((x) => <Card className="comm-card" key={x.date}><div className="comm-icon">{x.type === "客户邮件" ? "✉" : x.type.includes("WhatsApp") ? "W" : "▣"}</div><div className="comm-body"><div><Badge tone={x.tone}>{x.type}</Badge><span>{x.date}</span></div><strong>{x.author}</strong><p>{x.body}</p><div className="comm-actions"><button>回复草稿</button><button>转为待办</button><button>编辑备注</button></div></div></Card>)}<Card><div className="card-head"><h2>更多项目记录</h2><Badge>{records.length} 条</Badge></div><Timeline records={records} /></Card></div></>;
}

function SamplesQuotes() {
  return <div className="samples-layout"><Card><div className="card-head"><div><h2>样品管理</h2><p>样品版本与反馈状态</p></div><Button>＋ 新建样品版本</Button></div><div className="version-card active-version"><div className="version-title"><span>V2</span><div><strong>防水拉链功能样</strong><small>当前版本</small></div><Badge tone="purple">客户测试中</Badge></div><div className="version-grid"><div><span>寄出日期 / Ship Date</span><strong>2026-07-24</strong></div><div><span>签收日期 / Delivery Date</span><strong>2026-07-28</strong></div><div><span>样品数量 / Sample Quantity</span><strong>12 条</strong></div><div><span>快递 / Courier</span><strong>DHL · 模拟单号</strong></div></div><div className="feedback-box"><span>客户反馈 / Client Feedback</span><p>样品已签收。客户将优先测试 64 cm 黑色款，预计周四提供初步反馈。</p></div></div><div className="version-card"><div className="version-title"><span>V1</span><div><strong>外观与颜色样</strong><small>2026-07-08 寄出</small></div><Badge tone="neutral">已完成</Badge></div><p className="version-note">客户反馈：膜面光泽偏高，灰色略偏冷；相关问题已在 V2 中调整。</p></div></Card>
    <Card><div className="card-head"><div><h2>报价记录</h2><p>所有金额均为模拟数据</p></div><Button>＋ 新建报价</Button></div><div className="quote-card current"><div className="quote-head"><span>Q-V2</span><Badge tone="cyan">内部准备中</Badge></div><strong className="quote-price">USD 0.88 <small>/ 条</small></strong><div className="quote-grid"><div><span>数量 / Quantity</span><strong>120,000</strong></div><div><span>币种 / Currency</span><strong>USD</strong></div><div><span>贸易条款 / Incoterm</span><strong>FOB Ningbo</strong></div><div><span>有效期 / Validity</span><strong>30 天</strong></div></div><div className="feedback-box amber-box"><span>内部建议</span><p>按 80K / 120K / 200K 准备三档阶梯报价；水洗 5 次版本需另计材料成本。</p></div><Button className="full-button">预览报价</Button></div><div className="quote-card"><div className="quote-head"><span>Q-V1 · 2026-07-12</span><Badge>参考报价</Badge></div><strong className="quote-price small">USD 0.91 <small>/ 条</small></strong><p className="version-note">客户尚未正式反馈价格，目前先推进功能样测试。</p></div></Card></div>;
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
          {answers.map((item) => <div className="ai-answer" key={item.id}><div className="answer-meta"><span className="sparkle small-sparkle">✦</span><div><strong>{item.title}</strong><small>TrimFlow AI · {item.mode === "live" ? "OpenAI 实时回答" : "模拟回答"}</small></div><div className="answer-actions"><button onClick={() => { navigator.clipboard?.writeText(item.answer); showToast("内容已复制"); }}>复制</button><button onClick={() => void ask(item.title)}>重新生成</button></div></div><div className="answer-content">{item.answer}</div><div className={`prototype-note ${item.mode === "live" ? "live-note" : ""}`}>{item.mode === "live" ? "✓ 回答仅依据当前项目材料，并已通过结构化 JSON 校验。" : "ⓘ 当前为模拟 AI 模式；配置服务器端 API Key 后将自动使用 OpenAI。"}</div></div>)}
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
  const [language, setLanguage] = useState<InterfaceLanguage>("中文");
  const [newProject, setNewProject] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(""), 2500); };
  const openProject = (p: Project) => { setActiveProject(p); setView("detail"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const updateStage = (stage: Stage) => {
    setActiveProject((p) => ({ ...p, stage }));
    setProjects((all) => all.map((p) => p.id === activeProject.id ? { ...p, stage } : p));
    showToast(`项目阶段已更新为“${stage}”`);
  };
  const activeNav: WorkspaceView = view === "detail" ? "projects" : view;
  const title = useMemo(() => workspaceNavigation.find((item) => item.id === activeNav)?.label || "工作台", [activeNav]);
  const isPlaceholder = view !== "detail" && placeholderViews.has(view);
  const changeLanguage = (nextLanguage: InterfaceLanguage) => {
    setLanguage(nextLanguage);
    showToast(nextLanguage === "中文" ? "界面语言已切换为中文" : "Language switched to English");
  };
  const handleGlobalCreate = (type: GlobalCreateType) => {
    if (type === "project") {
      setNewProject(true);
      return;
    }
    if (type === "sample") setView("samples");
    if (type === "quotation") setView("quotations");
    if (type === "task") setView("todos");
    const labels: Record<Exclude<GlobalCreateType, "project">, string> = { sample: "样品", quotation: "报价", task: "待办" };
    showToast(`${labels[type]}新建入口已打开；完整流程将在后续步骤实现`);
  };
  return (
    <>
      <WorkspaceShell
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
          {view === "detail" && <ProjectDetail project={activeProject} onBack={() => setView("projects")} updateStage={updateStage} showToast={showToast} />}
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
