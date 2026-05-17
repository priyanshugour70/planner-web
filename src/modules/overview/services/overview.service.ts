import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { PlannerSummaryDTO } from "@/types/planner";

export async function fetchSummary(): Promise<APIEnvelope<PlannerSummaryDTO>> {
  return apiRequest<PlannerSummaryDTO>("/planner/summary");
}

export async function fetchSummaryUpdates(
  month: string
): Promise<APIEnvelope<Record<string, {
  tasks: number;
  habits: number;
  journals: number;
  notes: number;
  transactions: number;
  events: number;
  total: number;
}>>> {
  return apiRequest<Record<string, {
    tasks: number;
    habits: number;
    journals: number;
    notes: number;
    transactions: number;
    events: number;
    total: number;
  }>>(`/planner/summary/updates?month=${encodeURIComponent(month)}`);
}
