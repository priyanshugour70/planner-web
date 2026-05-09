import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { JournalEntryDTO } from "@/types/planner";

export async function fetchJournal(): Promise<APIEnvelope<JournalEntryDTO[]>> {
  return apiRequest<JournalEntryDTO[]>("/planner/journal");
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
