import { projects, tasks as caseTasks, type Task } from "../mock-data";
import type { BusinessChangeReceipt, SourceRecordRef } from "../activity-memory/types";

export type WorkspaceTask = Task & { accountId: string; ownerActorId?: string; titleEn?: string; sourceProposalId?: string; sourceMessageIds?: string[]; createdAt?: string; origin: "case" | "todo" | "deal_room" | "manual" };
export type TaskWorkspaceState = { tasks: WorkspaceTask[]; receipts: BusinessChangeReceipt[] };
const accountFor = (projectId: number) => projects.find((item) => item.id === projectId)?.clientId ?? "";
const demoTodos: WorkspaceTask[] = [
  { id: "todo-nas-test", projectId: 1, accountId: "client-nas", title: "跟进 NAS-2407 样品测试安排", titleEn: "Follow up on NAS-2407 sample testing", owner: "陈晨", ownerActorId: "actor-sales-a", priority: "P1", dueDate: "2026-08-08", status: "待处理", origin: "todo" },
  { id: "todo-efc-fees", projectId: 2, accountId: "client-efc", title: "完成 EFC-2411 测试费与模具费说明", titleEn: "Complete EFC-2411 testing and tooling fee explanation", owner: "王璐", ownerActorId: "actor-sales-b", priority: "P1", dueDate: "2026-08-08", status: "待处理", origin: "todo" },
  { id: "todo-eyw-specs", projectId: 3, accountId: "client-eyw", title: "发送瑜伽系列产品规格确认表", titleEn: "Send yoga collection specification confirmation", owner: "林薇", ownerActorId: "actor-sales-c", priority: "P2", dueDate: "2026-08-08", status: "待处理", origin: "todo" },
  { id: "todo-nas-tiers", projectId: 1, accountId: "client-nas", title: "整理三档数量报价", titleEn: "Prepare three volume tiers", owner: "陈晨", ownerActorId: "actor-sales-a", priority: "P2", dueDate: "2026-08-09", status: "已完成", origin: "todo" },
  { id: "todo-nas-report", projectId: 1, accountId: "client-nas", title: "更新本周项目周报", titleEn: "Update this week's project report", owner: "陈晨", ownerActorId: "actor-sales-a", priority: "P3", dueDate: "2026-08-14", status: "待处理", origin: "todo" },
];

export const createTaskWorkspace = (): TaskWorkspaceState => ({ tasks: [
  ...caseTasks.map((item) => ({ ...item, accountId: accountFor(item.projectId), ownerActorId: ({ "陈晨": "actor-sales-a", "王璐": "actor-sales-b", "林薇": "actor-sales-c" } as Record<string, string>)[item.owner], origin: "case" as const })),
  ...structuredClone(demoTodos),
], receipts: [] });

export function createWorkspaceTask(state: TaskWorkspaceState, task: WorkspaceTask, actorId: string, at: string, commandId: string, sourceRefs: SourceRecordRef[] = []): TaskWorkspaceState {
  if (state.tasks.some((item) => item.id === task.id) || state.receipts.some((item) => item.commandId === commandId)) return state;
  const expectedAccount = accountFor(task.projectId);
  if (!task.accountId || (expectedAccount && task.accountId !== expectedAccount)) throw new Error("Task account/project mismatch");
  const receipt: BusinessChangeReceipt = { id: `receipt-${commandId}`, commandId, entity: { kind: "task", id: task.id }, action: "task_created", occurredAt: at, performedByActorId: actorId, accountId: task.accountId, projectId: task.projectId, toStatus: task.status, sourceRefs: [{ provider: "trimflow", recordType: "task", recordId: task.id }, ...sourceRefs] };
  return { tasks: [...state.tasks, { ...task, createdAt: at }], receipts: [...state.receipts, receipt] };
}

export function changeTaskStatus(state: TaskWorkspaceState, taskId: string, toStatus: Task["status"], actorId: string, at: string, commandId: string): TaskWorkspaceState {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Task not found");
  if (task.status === toStatus || state.receipts.some((item) => item.commandId === commandId)) return state;
  if (toStatus !== "已完成" && task.status !== "已完成") throw new Error("Only completion or reopening is supported");
  const receipt: BusinessChangeReceipt = { id: `receipt-${commandId}`, commandId, entity: { kind: "task", id: taskId }, action: toStatus === "已完成" ? "task_completed" : "task_reopened", occurredAt: at, performedByActorId: actorId, accountId: task.accountId, projectId: task.projectId, fromStatus: task.status, toStatus, sourceRefs: [{ provider: "trimflow", recordType: "task", recordId: taskId }, ...(task.sourceProposalId ? [{ provider: "trimflow" as const, recordType: "deal_proposal", recordId: task.sourceProposalId }] : [])] };
  return { tasks: state.tasks.map((item) => item.id === taskId ? { ...item, status: toStatus } : item), receipts: [...state.receipts, receipt] };
}
