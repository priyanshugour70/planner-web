import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { NoteDTO } from "@/types/planner";

export async function fetchNotes(): Promise<APIEnvelope<NoteDTO[]>> {
  return apiRequest<NoteDTO[]>("/planner/notes");
}

export async function createNote(body: Record<string, unknown>): Promise<APIEnvelope<NoteDTO>> {
  return apiRequest<NoteDTO>("/planner/notes", { method: "POST", body: JSON.stringify(body) });
}

export async function updateNote(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<NoteDTO>> {
  return apiRequest<NoteDTO>(`/planner/notes/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteNote(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/notes/${id}`, { method: "DELETE" });
}
