import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { PlannerSummaryDTO } from "@/types/planner";

export async function fetchSummary(): Promise<APIEnvelope<PlannerSummaryDTO>> {
  return apiRequest<PlannerSummaryDTO>("/planner/summary");
}
