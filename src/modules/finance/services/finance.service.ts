import { apiRequest } from "@/lib/client/http";
import type { APIEnvelope } from "@/types/api-response";
import type {
  BudgetDTO,
  BudgetRollupDTO,
  DebtObligationDTO,
  DebtPaymentDTO,
  FinanceAccountDTO,
  FinanceCategoryDTO,
  FinanceSummaryDTO,
  TransactionDTO,
} from "@/types/planner";
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

export async function fetchBudgetRollup(): Promise<APIEnvelope<BudgetRollupDTO[]>> {
  return apiRequest<BudgetRollupDTO[]>("/planner/finance/budget-rollup");
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

export async function updateTransaction(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<TransactionDTO>> {
  return apiRequest<TransactionDTO>(`/planner/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteTransaction(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/transactions/${id}`, { method: "DELETE" });
}

export async function fetchFinanceAccounts(): Promise<APIEnvelope<FinanceAccountDTO[]>> {
  return apiRequest<FinanceAccountDTO[]>("/planner/finance/accounts");
}

export async function createFinanceAccount(
  body: Record<string, unknown>
): Promise<APIEnvelope<FinanceAccountDTO>> {
  return apiRequest<FinanceAccountDTO>("/planner/finance/accounts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateFinanceAccount(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<FinanceAccountDTO>> {
  return apiRequest<FinanceAccountDTO>(`/planner/finance/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteFinanceAccount(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/finance/accounts/${id}`, { method: "DELETE" });
}

export async function fetchFinanceCategories(): Promise<APIEnvelope<FinanceCategoryDTO[]>> {
  return apiRequest<FinanceCategoryDTO[]>("/planner/finance/categories");
}

export async function createFinanceCategory(
  body: Record<string, unknown>
): Promise<APIEnvelope<FinanceCategoryDTO>> {
  return apiRequest<FinanceCategoryDTO>("/planner/finance/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateFinanceCategory(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<FinanceCategoryDTO>> {
  return apiRequest<FinanceCategoryDTO>(`/planner/finance/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteFinanceCategory(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/finance/categories/${id}`, { method: "DELETE" });
}

export async function fetchDebtObligations(): Promise<APIEnvelope<DebtObligationDTO[]>> {
  return apiRequest<DebtObligationDTO[]>("/planner/debt/obligations");
}

export async function createDebtObligation(
  body: Record<string, unknown>
): Promise<APIEnvelope<DebtObligationDTO>> {
  return apiRequest<DebtObligationDTO>("/planner/debt/obligations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateDebtObligation(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<DebtObligationDTO>> {
  return apiRequest<DebtObligationDTO>(`/planner/debt/obligations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteDebtObligation(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/debt/obligations/${id}`, { method: "DELETE" });
}

export async function fetchDebtPayments(obligationId: string): Promise<APIEnvelope<DebtPaymentDTO[]>> {
  return apiRequest<DebtPaymentDTO[]>(`/planner/debt/obligations/${obligationId}/payments`);
}

export async function createDebtPayment(
  obligationId: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<DebtPaymentDTO>> {
  return apiRequest<DebtPaymentDTO>(`/planner/debt/obligations/${obligationId}/payments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
