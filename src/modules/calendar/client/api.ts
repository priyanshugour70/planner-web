import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { CalendarEventDTO } from "@/types/planner";
import { q } from "@/modules/shared/client/query-string";

export async function fetchCalendarEvents(
  from?: string,
  to?: string
): Promise<APIEnvelope<CalendarEventDTO[]>> {
  return apiRequest<CalendarEventDTO[]>(`/planner/calendar-events${q({ from, to })}`);
}

export async function createCalendarEvent(
  body: Record<string, unknown>
): Promise<APIEnvelope<CalendarEventDTO>> {
  return apiRequest<CalendarEventDTO>("/planner/calendar-events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteCalendarEvent(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/calendar-events/${id}`, { method: "DELETE" });
}
