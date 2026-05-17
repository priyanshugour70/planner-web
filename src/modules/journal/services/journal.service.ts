import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { JournalEntryDTO, JournalAnalyticsDTO } from "@/types/planner";

// ─── List / CRUD ────────────────────────────────────────────────────────────────

export type JournalListOpts = {
  mood?: string;
  from?: string;
  to?: string;
  favoritesOnly?: boolean;
  q?: string;
  limit?: number;
};

export async function fetchJournal(opts?: JournalListOpts): Promise<APIEnvelope<JournalEntryDTO[]>> {
  const params = new URLSearchParams();
  if (opts?.mood) params.set("mood", opts.mood);
  if (opts?.from) params.set("from", opts.from);
  if (opts?.to) params.set("to", opts.to);
  if (opts?.favoritesOnly) params.set("favoritesOnly", "true");
  if (opts?.q) params.set("q", opts.q);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<JournalEntryDTO[]>(`/planner/journal${qs}`);
}

export async function getJournalEntry(id: string): Promise<APIEnvelope<JournalEntryDTO>> {
  return apiRequest<JournalEntryDTO>(`/planner/journal/${id}`);
}

export async function createJournalEntry(
  body: Record<string, unknown>
): Promise<APIEnvelope<JournalEntryDTO>> {
  return apiRequest<JournalEntryDTO>("/planner/journal", { method: "POST", body: JSON.stringify(body) });
}

export async function updateJournalEntry(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<JournalEntryDTO>> {
  return apiRequest<JournalEntryDTO>(`/planner/journal/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteJournalEntry(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/journal/${id}`, { method: "DELETE" });
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export type JournalAnalyticsResponse = JournalAnalyticsDTO & {
  promptOfTheDay: string;
};

export async function fetchJournalAnalytics(): Promise<APIEnvelope<JournalAnalyticsResponse>> {
  return apiRequest<JournalAnalyticsResponse>("/planner/journal/analytics");
}
