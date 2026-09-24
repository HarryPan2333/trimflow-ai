"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "../providers/language-provider";
import { Badge, Button, Card, Modal } from "../ui/primitives";
import { PageHeader } from "../layout/page-header";
import type { AccountState } from "../../lib/accounts/types";
import type { Project } from "../../lib/mock-data";
import type { TaskWorkspaceState, WorkspaceTask } from "../../lib/tasks/workspace";
import { DEMO_REPORT_DATE } from "../../lib/reports/period";

export function TaskList({ state, accounts, projects, onCreate, onToggle }: { state: TaskWorkspaceState; accounts: AccountState; projects: Project[];
  onCreate: (task: WorkspaceTask, actorId: string) => void; onToggle: (taskId: string, actorId: string) => void }) {
  const { language, t, text } = useI18n();
  const [modal, setModal] = useState(false);
  const [actorId, setActorId] = useState("actor-sales-a");
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  const now = DEMO_REPORT_DATE;
  const tasks = state.tasks.filter((item) => filter === "all" || (filter === "today" ? item.dueDate === now : item.dueDate >= now && item.dueDate <= "2026-08-09"));
  const dueToday = state.tasks.filter((item) => item.dueDate === now && item.status !== "已完成").length;
  const weekTotal = state.tasks.filter((item) => item.dueDate >= now && item.dueDate <= "2026-08-09").length;
  const completed = state.tasks.filter((item) => item.status === "已完成").length;
  const overdue = state.tasks.filter((item) => item.dueDate && item.dueDate < now && item.status !== "已完成").length;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const projectId = Number(form.get("projectId"));
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    const ownerActorId = String(form.get("ownerActorId"));
    const owner = accounts.actors.find((item) => item.id === ownerActorId)?.displayName.zh ?? t("common.notAssigned");
    onCreate({ id: `task-${crypto.randomUUID()}`, projectId, accountId: project.clientId, title: String(form.get("title")).trim(), owner, ownerActorId, priority: String(form.get("priority")) as WorkspaceTask["priority"], dueDate: String(form.get("dueDate")), status: "待处理", origin: "manual" }, actorId);
    setModal(false);
  };
  return <div className="task-workspace"><PageHeader title={t("tasks.title")} subtitle={t("tasks.subtitle")} actions={<Button onClick={() => setModal(true)}>＋ {t("tasks.add")}</Button>} />
    <p className="report-demo-note">{t("report.demoDate")}: {DEMO_REPORT_DATE} · {t("report.sessionNotice")}</p>
    <div className="todo-summary"><Card><span>{t("tasks.todayDue")}</span><strong>{dueToday}</strong></Card><Card><span>{t("tasks.weekTotal")}</span><strong>{weekTotal}</strong></Card><Card><span>{t("tasks.completed")}</span><strong>{completed}</strong></Card><Card><span>{t("tasks.overdue")}</span><strong className="red-text">{overdue}</strong></Card></div>
    <Card><div className="card-head"><div><h2>{t("tasks.myTasks")}</h2><p>{t("tasks.sortHelp")}</p></div><div className="segment"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{t("common.all")}</button><button className={filter === "today" ? "active" : ""} onClick={() => setFilter("today")}>{t("tasks.today")}</button><button className={filter === "week" ? "active" : ""} onClick={() => setFilter("week")}>{t("tasks.filterWeek")}</button></div></div>
      <div className="task-list">{tasks.map((task) => <div className={`task-row ${task.status === "已完成" ? "task-done" : ""}`} key={task.id}><button className="task-check" aria-label={task.status === "已完成" ? t("tasks.restored") : t("tasks.completed")} onClick={() => onToggle(task.id, actorId)}>{task.status === "已完成" ? "✓" : ""}</button><span className={task.priority === "P1" ? "priority p1" : "priority"}>{task.priority}</span><div className="task-main"><strong>{language === "en" ? task.titleEn ?? task.title : task.title}</strong><small>{text(projects.find((item) => item.id === task.projectId)?.name ?? task.accountId)} · {task.sourceProposalId ? `${t("report.source")}: ${task.sourceProposalId}` : task.origin}</small></div><span>{accounts.actors.find((item) => item.id === task.ownerActorId)?.displayName[language] ?? task.owner}</span><Badge tone={task.dueDate && task.dueDate < now && task.status !== "已完成" ? "red" : "neutral"}>{task.dueDate || "—"}</Badge></div>)}{!tasks.length && <p className="report-empty">{t("report.empty")}</p>}</div></Card>
    {modal && <Modal title={t("tasks.add")} onClose={() => setModal(false)}><form className="modal-form" onSubmit={submit}><label>{t("account.currentActor")}<select value={actorId} onChange={(event) => setActorId(event.target.value)}>{accounts.actors.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{text(item.displayName)}</option>)}</select></label><label>{t("common.project")}<select name="projectId" required>{projects.map((item) => <option key={item.id} value={item.id}>{item.code} · {text(item.name)}</option>)}</select></label><label>{t("project.activity.title")}<input name="title" required maxLength={140} /></label><div className="form-row"><label>{t("common.owner")}<select name="ownerActorId" required>{accounts.actors.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{text(item.displayName)}</option>)}</select></label><label>{t("tasks.priority")}<select name="priority" defaultValue="P2"><option>P1</option><option>P2</option><option>P3</option></select></label></div><label>{t("deal.dueDate")}<input name="dueDate" type="date" /></label><div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setModal(false)}>{t("common.cancel")}</Button><Button type="submit">{t("common.save")}</Button></div></form></Modal>}
  </div>;
}
