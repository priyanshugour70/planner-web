import "server-only";
import { getSql } from "@/lib/db";
import { isoDate } from "@/modules/shared/server/serialize-helpers";
import type { BudgetRollupDTO, FinanceSummaryDTO } from "@/types/planner";

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

/** Expense totals per budget within each budget's own period window. */
export async function computeBudgetRollups(userId: bigint): Promise<BudgetRollupDTO[]> {
  const sql = getSql();
  const rows = await sql<
    {
      id: bigint;
      name: string;
      category: string | null;
      amount_limit: string;
      period_start: Date;
      period_end: Date;
      spent: string;
    }[]
  >`
    SELECT
      b.id,
      b.name,
      b.category,
      b.amount_limit::text,
      b.period_start,
      b.period_end,
      COALESCE(
        SUM(
          CASE
            WHEN t.kind = 'expense'::finance_tx_kind THEN t.amount
            ELSE 0::numeric
          END
        ),
        0
      )::text AS spent
    FROM budgets b
    LEFT JOIN transactions t
      ON t.budget_id = b.id
      AND t.user_id = b.user_id
      AND t.occurred_on >= b.period_start
      AND t.occurred_on <= b.period_end
    WHERE b.user_id = ${userId}
    GROUP BY b.id, b.name, b.category, b.amount_limit, b.period_start, b.period_end
    ORDER BY b.period_start DESC, b.id DESC
  `;
  return rows.map((r) => ({
    budgetId: String(r.id),
    name: r.name,
    category: r.category,
    amountLimit: r.amount_limit,
    spent: r.spent,
    periodStart: isoDate(r.period_start),
    periodEnd: isoDate(r.period_end),
  }));
}
