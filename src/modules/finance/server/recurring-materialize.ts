import "server-only";
import type { SqlClient } from "@/lib/db";
import { HttpError } from "@/modules/auth/server/http-error";
import { requireFinanceAccount, requireFinanceCategory } from "@/modules/finance/server/guards";
import { addCalendarMonthsUtc } from "@/modules/finance/server/calendar-month";
import { parseAmount } from "@/modules/finance/server/schemas";
import type { RecurringRuleRow, TransactionRow } from "@/modules/finance/server/serialize";
import { isoDate } from "@/modules/shared/server/serialize-helpers";
import { ErrorCodes } from "@/types/api-error";

async function requireBudget(sql: SqlClient, userId: bigint, budgetId: bigint): Promise<void> {
  const [row] = await sql`SELECT id FROM budgets WHERE id = ${budgetId} AND user_id = ${userId} LIMIT 1`;
  if (!row) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid budget");
}

/**
 * Creates `transactions` for all active recurring rules with `next_run_on <= throughIso` (UTC dates).
 * Advances each rule's `next_run_on` month-by-month for `cadence = monthly`.
 */
export async function materializeDueRecurringRules(
  sql: SqlClient,
  userId: bigint,
  throughIso: string
): Promise<{ createdIds: string[] }> {
  const createdIds: string[] = [];

  await sql.begin(async (tx) => {
    const rules = await tx<RecurringRuleRow[]>`
      SELECT
        id,
        user_id,
        template_kind,
        template_amount::text,
        template_category,
        cadence,
        next_run_on,
        active,
        label,
        account_id,
        budget_id,
        category_id
      FROM recurring_transaction_rules
      WHERE user_id = ${userId}
        AND active = TRUE
        AND next_run_on <= ${throughIso}::date
      ORDER BY id ASC
      FOR UPDATE
    `;

    for (const rule of rules) {
      if (rule.cadence !== "monthly") {
        throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, `Unsupported cadence: ${rule.cadence}`);
      }

      let next = isoDate(rule.next_run_on);
      if (!next) continue;
      const amt = parseAmount(rule.template_amount);

      const sqlTx = tx as unknown as SqlClient;
      if (rule.account_id) await requireFinanceAccount(sqlTx, userId, rule.account_id);
      if (rule.category_id) await requireFinanceCategory(sqlTx, userId, rule.category_id);
      if (rule.budget_id) await requireBudget(sqlTx, userId, rule.budget_id);

      const note = `Recurring · ${rule.label}`;
      const merchant = null;
      const paymentMethod = null;

      while (next <= throughIso) {
        const [row] = await tx<TransactionRow[]>`
          INSERT INTO transactions (
            user_id,
            budget_id,
            kind,
            amount,
            category,
            note,
            occurred_on,
            account_id,
            category_id,
            merchant,
            payment_method,
            tags
          )
          VALUES (
            ${userId},
            ${rule.budget_id},
            ${rule.template_kind}::finance_tx_kind,
            ${amt}::numeric,
            ${rule.template_category},
            ${note},
            ${next}::date,
            ${rule.account_id},
            ${rule.category_id},
            ${merchant},
            ${paymentMethod},
            ARRAY[]::text[]
          )
          RETURNING *
        `;
        if (row) createdIds.push(String(row.id));
        next = addCalendarMonthsUtc(next, 1);
      }

      await tx`
        UPDATE recurring_transaction_rules
        SET next_run_on = ${next}::date
        WHERE id = ${rule.id} AND user_id = ${userId}
      `;
    }
  });

  return { createdIds };
}
