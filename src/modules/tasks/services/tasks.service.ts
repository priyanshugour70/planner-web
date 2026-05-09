import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { TaskDTO } from "@/types/planner";
import { q } from "@/modules/shared/client/query-string";

export async function fetchTasks(filters?: {
  status?: string;
  goalId?: string;
}): Promise<APIEnvelope<TaskDTO[]>> {
  return apiRequest<TaskDTO[]>(`/planner/tasks${q(filters ?? {})}`);
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
