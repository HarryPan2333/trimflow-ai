"use client";

import { useMemo, useState } from "react";
import { Badge, Card } from "../ui/primitives";
import { PageHeader } from "../layout/page-header";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import type { Project } from "../../lib/mock-data";
import { SampleList } from "./sample-list";
import { DEMO_DATE, demoNotice, getSampleContext, getSampleStatus, matchesSampleFilter } from "./sample-data";
import type { SampleFilter, SampleWorkspace } from "./sample-data";

const filters: Array<{ id: SampleFilter; zh: string }> = [{ id: "All", zh: "全部" }, { id: "In Development", zh: "开发中" }, { id: "Waiting for Client", zh: "待客户反馈" }, { id: "Revision Required", zh: "需要修改" }, { id: "Approved", zh: "已确认" }];

export function SampleCenter({ workspace, projects, onOpenSample, language }: { workspace: SampleWorkspace; projects: Project[]; onOpenSample: (id: string) => void; language: InterfaceLanguage }) {
  const [filter, setFilter] = useState<SampleFilter>("All");
  const [search, setSearch] = useState("");
  const isEn = language === "English";
  const contexts = useMemo(() => workspace.samples.map((sample) => getSampleContext(sample, workspace, projects)), [workspace, projects]);
  const filtered = contexts.filter((context) => matchesSampleFilter(context, filter) && `${context.sample.id} ${context.sample.product} ${context.client?.name} ${context.project?.name} ${context.project?.code}`.toLowerCase().includes(search.trim().toLowerCase()));
  const stats = [
    { name: "开发中样品", en: "Active Samples", value: contexts.filter((context) => !["Approved", "Rejected", "Closed"].includes(getSampleStatus(context))).length },
    { name: "待客户反馈", en: "Waiting for Client", value: contexts.filter((context) => matchesSampleFilter(context, "Waiting for Client")).length },
    { name: "需要修改", en: "Revision Required", value: contexts.filter((context) => getSampleStatus(context) === "Revision Required").length },
    { name: "已确认", en: "Approved", value: contexts.filter((context) => getSampleStatus(context) === "Approved").length },
  ];
  return <div className="sample-workspace">
    <PageHeader title={isEn ? "Sample Development" : "样品开发中心"} subtitle={isEn ? "Manage sample development, revisions, feedback and approval." : "Sample Development · 集中管理样品开发、版本迭代、客户反馈与确认。"} actions={<Badge tone="blue">Demo Workspace</Badge>} />
    <div className="sample-summary-bar">{stats.map((item) => <div key={item.en}><span>{isEn ? item.en : item.name}<small>{isEn ? "" : item.en}</small></span><strong>{item.value}</strong></div>)}</div>
    <Card className="sample-list-panel"><div className="sample-list-toolbar"><div className="sample-filters" role="group" aria-label="样品状态筛选">{filters.map((item) => <button key={item.id} className={filter === item.id ? "active" : ""} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{isEn ? item.id : item.zh}</button>)}</div><label className="sample-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="搜索样品" placeholder={isEn ? "Sample, client, project or product…" : "搜索样品、客户、项目或产品…"} /></label></div>
      <div className="sample-list-meta"><span>{filtered.length} {isEn ? "samples" : "个样品"}</span><span>{isEn ? "Demo date" : "演示日期"} · {DEMO_DATE}</span></div>
      <SampleList rows={filtered} onOpenSample={onOpenSample} language={language} />
    </Card><p className="sample-demo-note">{isEn ? "Demo Workspace · Session changes reset when you refresh." : demoNotice}</p>
  </div>;
}
