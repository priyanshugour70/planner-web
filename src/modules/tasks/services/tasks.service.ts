import { apiRequest } from "@/lib/client/http";
import { q } from "@/modules/shared/client/query-string";
import type { APIEnvelope } from "@/types/api-response";
import type { TaskDTO } from "@/types/planner";

export type TaskListParams = {
  status?: string;
  goalId?: string;
  parentTaskId?: string;
  /** List only root tasks (no parent). */
  rootsOnly?: boolean;
  /** Title substring (case-insensitive). */
  q?: string;
  limit?: number;
  sort?: "due" | "updated" | "priority" | "created";
};

function taskQueryString(filters?: TaskListParams): string {
  if (!filters) return "";
  const p: Record<string, string | undefined> = {};
  if (filters.status) p.status = filters.status;
  if (filters.goalId) p.goalId = filters.goalId;
  if (filters.parentTaskId) p.parentTaskId = filters.parentTaskId;
  if (filters.rootsOnly === true) p.rootsOnly = "true";
  if (filters.q?.trim()) p.q = filters.q.trim();
  if (filters.limit != null) p.limit = String(filters.limit);
  if (filters.sort) p.sort = filters.sort;
  return q(p);
}

export async function fetchTasks(filters?: TaskListParams): Promise<APIEnvelope<TaskDTO[]>> {
  return apiRequest<TaskDTO[]>(`/planner/tasks${taskQueryString(filters)}`);
}

export async function fetchTask(id: string): Promise<APIEnvelope<TaskDTO>> {
  return apiRequest<TaskDTO>(`/planner/tasks/${id}`);
}

export async function createTask(body: Record<string, unknown>): Promise<APIEnvelope<TaskDTO>> {
  return apiRequest<TaskDTO>("/planner/tasks", { method: "POST", body: JSON.stringify(body) });
}

export async function updateTask(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<TaskDTO>> {
  return apiRequest<TaskDTO>(`/planner/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteTask(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/tasks/${id}`, { method: "DELETE" });
}
