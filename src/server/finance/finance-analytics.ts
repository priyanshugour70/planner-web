import "server-only";
import { getSql } from "@/lib/db";

export type FinanceSummaryDTO = {
  monthSpend: string;
  monthIncome: string;
  openDebtCount: number;
  openDebtExposure: string;
  upcomingDebtDue7d: number;
  budgetCount: number;
};

/**
 * Aggregated finance intelligence for overview + finance home.
 * Uses current calendar month boundaries (UTC date).
 */
export async function computeFinanceSummary(userId: bigint): Promise<FinanceSummaryDTO> {
  const sql = getSql();
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const [spend] = await sql<{ s: string }[]>`
    SELECT COALESCE(SUM(amount), 0)::text AS s FROM transactions
    WHERE user_id = ${userId}
      AND kind = 'expense'::finance_tx_kind
      AND occurred_on >= ${startStr}::date
      AND occurred_on < ${endStr}::date
  `;
  const [inc] = await sql<{ s: string }[]>`
    SELECT COALESCE(SUM(amount), 0)::text AS s FROM transactions
    WHERE user_id = ${userId}
      AND kind = 'income'::finance_tx_kind
      AND occurred_on >= ${startStr}::date
      AND occurred_on < ${endStr}::date
  `;

  const [debtOpen] = await sql<{ c: number; exposure: string }[]>`
    SELECT COUNT(*)::int AS c, COALESCE(SUM(balance), 0)::text AS exposure
    FROM debt_obligations
    WHERE user_id = ${userId} AND status = 'open'
  `;

  const dueUntil = new Date();
  dueUntil.setUTCDate(dueUntil.getUTCDate() + 7);
  const dueStr = dueUntil.toISOString().slice(0, 10);

  const [dueSoon] = await sql<{ c: number }[]>`
    SELECT COUNT(*)::int AS c FROM debt_obligations
    WHERE user_id = ${userId}
      AND status = 'open'
      AND due_date IS NOT NULL
      AND due_date <= ${dueStr}::date
  `;

  const [budgets] = await sql<{ c: number }[]>`
    SELECT COUNT(*)::int AS c FROM budgets WHERE user_id = ${userId}
  `;

  return {
    monthSpend: spend?.s ?? "0",
    monthIncome: inc?.s ?? "0",
    openDebtCount: debtOpen?.c ?? 0,
    openDebtExposure: debtOpen?.exposure ?? "0",
    upcomingDebtDue7d: dueSoon?.c ?? 0,
    budgetCount: budgets?.c ?? 0,
  };
}
