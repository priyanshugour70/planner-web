import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { HabitDTO, HabitEntryDTO, HabitAnalyticsDTO, HabitsSummaryDTO } from "@/types/planner";

// ─── List / CRUD ────────────────────────────────────────────────────────────────

export async function fetchHabits(opts?: { archived?: boolean }): Promise<APIEnvelope<HabitDTO[]>> {
  const qs = opts?.archived ? "?archived=true" : "";
  return apiRequest<HabitDTO[]>(`/planner/habits${qs}`);
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

// ─── Entries ────────────────────────────────────────────────────────────────────

export async function fetchHabitEntries(
  habitId: string,
  opts?: { from?: string; to?: string; limit?: number }
): Promise<APIEnvelope<HabitEntryDTO[]>> {
  const params = new URLSearchParams();
  if (opts?.from) params.set("from", opts.from);
  if (opts?.to) params.set("to", opts.to);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<HabitEntryDTO[]>(`/planner/habits/${habitId}/entries${qs}`);
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

// ─── Analytics ──────────────────────────────────────────────────────────────────

export type HabitsAnalyticsResponse = {
  habits: HabitAnalyticsDTO[];
  summary: HabitsSummaryDTO;
};

export async function fetchHabitsAnalytics(): Promise<APIEnvelope<HabitsAnalyticsResponse>> {
  return apiRequest<HabitsAnalyticsResponse>("/planner/habits/analytics");
}
