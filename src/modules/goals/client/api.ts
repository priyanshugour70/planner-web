import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { GoalDTO, MilestoneDTO } from "@/types/planner";
import { q } from "@/modules/shared/client/query-string";

export async function fetchGoals(status?: string): Promise<APIEnvelope<GoalDTO[]>> {
  return apiRequest<GoalDTO[]>(`/planner/goals${q({ status })}`);
}

export async function createGoal(body: Record<string, unknown>): Promise<APIEnvelope<GoalDTO>> {
  return apiRequest<GoalDTO>("/planner/goals", { method: "POST", body: JSON.stringify(body) });
}

export async function updateGoal(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<GoalDTO>> {
  return apiRequest<GoalDTO>(`/planner/goals/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteGoal(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/goals/${id}`, { method: "DELETE" });
}

export async function fetchMilestones(goalId: string): Promise<APIEnvelope<MilestoneDTO[]>> {
  return apiRequest<MilestoneDTO[]>(`/planner/goals/${goalId}/milestones`);
}

export async function createMilestone(
  goalId: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<MilestoneDTO>> {
  return apiRequest<MilestoneDTO>(`/planner/goals/${goalId}/milestones`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateMilestone(
  goalId: string,
  milestoneId: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<MilestoneDTO>> {
  return apiRequest<MilestoneDTO>(`/planner/goals/${goalId}/milestones/${milestoneId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteMilestone(
  goalId: string,
  milestoneId: string
): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/goals/${goalId}/milestones/${milestoneId}`, {
    method: "DELETE",
  });
}
