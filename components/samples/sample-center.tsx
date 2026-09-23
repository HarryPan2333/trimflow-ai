"use client";

import { useMemo, useState } from "react";
import { Badge, Card } from "../ui/primitives";
import { PageHeader } from "../layout/page-header";
import type { InterfaceLanguage } from "../layout/workspace-shell";
import type { Project } from "../../lib/mock-data";
import type { AccountState } from "../../lib/accounts/types";
import { SampleList } from "./sample-list";
import { DEMO_DATE, getSampleContext, getSampleStatus, matchesSampleFilter } from "./sample-data";
import type { SampleFilter, SampleWorkspace } from "./sample-data";
import { useI18n } from "../providers/language-provider";

const filters: Array<{ id: SampleFilter; key: "sample.all" | "sample.inDevelopment" | "sample.waitingClient" | "sample.revisionRequired" | "sample.approved" }> = [{ id: "All", key: "sample.all" }, { id: "In Development", key: "sample.inDevelopment" }, { id: "Waiting for Client", key: "sample.waitingClient" }, { id: "Revision Required", key: "sample.revisionRequired" }, { id: "Approved", key: "sample.approved" }];

export function SampleCenter({ workspace, projects, accountState, onOpenSample, language }: { workspace: SampleWorkspace; projects: Project[]; accountState?: AccountState; onOpenSample: (id: string) => void; language: InterfaceLanguage }) {
  const [filter, setFilter] = useState<SampleFilter>("All");
  const [search, setSearch] = useState("");
  const { t, formatDate } = useI18n();
  const contexts = useMemo(() => workspace.samples.map((sample) => getSampleContext(sample, workspace, projects, accountState)), [workspace, projects, accountState]);
  const filtered = contexts.filter((context) => matchesSampleFilter(context, filter) && `${context.sample.id} ${context.sample.product} ${context.client?.name} ${context.project?.name} ${context.project?.code}`.toLowerCase().includes(search.trim().toLowerCase()));
  const stats = [
    { key: "sample.stats.active" as const, value: contexts.filter((context) => !["Approved", "Rejected", "Closed"].includes(getSampleStatus(context))).length },
    { key: "sample.waitingClient" as const, value: contexts.filter((context) => matchesSampleFilter(context, "Waiting for Client")).length },
    { key: "sample.revisionRequired" as const, value: contexts.filter((context) => getSampleStatus(context) === "Revision Required").length },
    { key: "sample.approved" as const, value: contexts.filter((context) => getSampleStatus(context) === "Approved").length },
  ];
  return <div className="sample-workspace">
    <PageHeader title={t("sample.centerTitle")} subtitle={t("sample.centerSubtitle")} actions={<Badge tone="blue">{t("common.demoWorkspace")}</Badge>} />
    <div className="sample-summary-bar">{stats.map((item) => <div key={item.key}><span>{t(item.key)}</span><strong>{item.value}</strong></div>)}</div>
    <Card className="sample-list-panel"><div className="sample-list-toolbar"><div className="sample-filters" role="group" aria-label={t("common.status")}>{filters.map((item) => <button key={item.id} className={filter === item.id ? "active" : ""} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{t(item.key)}</button>)}</div><label className="sample-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label={t("sample.search")} placeholder={t("sample.search")} /></label></div>
      <div className="sample-list-meta"><span>{t("common.count", { count: filtered.length })}</span><span>{t("common.demoDate")} · {formatDate(DEMO_DATE)}</span></div>
      <SampleList rows={filtered} onOpenSample={onOpenSample} language={language} />
    </Card><p className="sample-demo-note">{t("common.demoWorkspace")} · {t("common.sessionReset")}</p>
  </div>;
}
