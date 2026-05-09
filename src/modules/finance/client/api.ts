import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type { BudgetDTO, FinanceSummaryDTO, TransactionDTO } from "@/types/planner";
import { q } from "@/modules/shared/client/query-string";

export async function fetchBudgets(): Promise<APIEnvelope<BudgetDTO[]>> {
  return apiRequest<BudgetDTO[]>("/planner/budgets");
}

export async function createBudget(body: Record<string, unknown>): Promise<APIEnvelope<BudgetDTO>> {
  return apiRequest<BudgetDTO>("/planner/budgets", { method: "POST", body: JSON.stringify(body) });
}

export async function updateBudget(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<BudgetDTO>> {
  return apiRequest<BudgetDTO>(`/planner/budgets/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteBudget(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/budgets/${id}`, { method: "DELETE" });
}

export async function fetchTransactions(opts?: {
  from?: string;
  to?: string;
  limit?: string;
  cursor?: string;
}): Promise<APIEnvelope<TransactionDTO[]>> {
  return apiRequest<TransactionDTO[]>(`/planner/transactions${q(opts ?? {})}`);
}

export async function fetchFinanceSummary(): Promise<APIEnvelope<FinanceSummaryDTO>> {
  return apiRequest<FinanceSummaryDTO>("/planner/finance/summary");
}

export async function createTransaction(
  body: Record<string, unknown>
): Promise<APIEnvelope<TransactionDTO>> {
  return apiRequest<TransactionDTO>("/planner/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteTransaction(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/transactions/${id}`, { method: "DELETE" });
}
