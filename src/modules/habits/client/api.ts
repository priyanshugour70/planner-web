import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { HabitDTO, HabitEntryDTO } from "@/types/planner";

export async function fetchHabits(): Promise<APIEnvelope<HabitDTO[]>> {
  return apiRequest<HabitDTO[]>("/planner/habits");
}

export async function createHabit(body: Record<string, unknown>): Promise<APIEnvelope<HabitDTO>> {
  return apiRequest<HabitDTO>("/planner/habits", { method: "POST", body: JSON.stringify(body) });
}

export async function updateHabit(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<HabitDTO>> {
  return apiRequest<HabitDTO>(`/planner/habits/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteHabit(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/habits/${id}`, { method: "DELETE" });
}

export async function fetchHabitEntries(habitId: string): Promise<APIEnvelope<HabitEntryDTO[]>> {
  return apiRequest<HabitEntryDTO[]>(`/planner/habits/${habitId}/entries`);
}

export async function logHabitEntry(
  habitId: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<HabitEntryDTO>> {
  return apiRequest<HabitEntryDTO>(`/planner/habits/${habitId}/entries`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteHabitEntry(
  habitId: string,
  entryId: string
): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/habits/${habitId}/entries/${entryId}`, { method: "DELETE" });
}
