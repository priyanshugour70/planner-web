import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql, type SqlClient } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { requireFinanceAccount, requireFinanceCategory } from "@/modules/finance/server/guards";
import { parseAmount, recurringRuleCreateSchema } from "@/modules/finance/server/schemas";
import { serializeRecurringRule, type RecurringRuleRow } from "@/modules/finance/server/serialize";
import { ErrorCodes } from "@/types/api-error";

async function requireBudget(sql: SqlClient, userId: bigint, budgetId: bigint): Promise<void> {
  const [row] = await sql`SELECT id FROM budgets WHERE id = ${budgetId} AND user_id = ${userId} LIMIT 1`;
  if (!row) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid budget");
}

export const GET = withApiRoute(
  { module: "planner", action: "finance_recurring_rules_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const rows = await sql<RecurringRuleRow[]>`
      SELECT
        id,
        user_id,
        template_kind,
        template_amount::text,
        template_category,
        cadence,
        next_run_on,
        active,
        created_at,
        label,
        account_id,
        budget_id,
        category_id
      FROM recurring_transaction_rules
      WHERE user_id = ${auth.userId}
      ORDER BY active DESC, next_run_on ASC, id ASC
    `;
    return jsonSuccess(requestId, rows.map(serializeRecurringRule));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "finance_recurring_rules_create", parseBody: recurringRuleCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const amt = parseAmount(body.templateAmount);
    const active = body.active ?? true;
    let accountId: bigint | null = null;
    let budgetId: bigint | null = null;
    let categoryId: bigint | null = null;
    if (body.accountId) {
      accountId = BigInt(body.accountId);
      await requireFinanceAccount(sql, auth.userId, accountId);
    }
    if (body.budgetId) {
      budgetId = BigInt(body.budgetId);
      await requireBudget(sql, auth.userId, budgetId);
    }
    if (body.categoryId) {
      categoryId = BigInt(body.categoryId);
      await requireFinanceCategory(sql, auth.userId, categoryId);
    }
    const [row] = await sql<RecurringRuleRow[]>`
      INSERT INTO recurring_transaction_rules (
        user_id,
        label,
        template_kind,
        template_amount,
        template_category,
        cadence,
        next_run_on,
        active,
        account_id,
        budget_id,
        category_id
      )
      VALUES (
        ${auth.userId},
        ${body.label},
        ${body.templateKind}::finance_tx_kind,
        ${amt}::numeric,
        ${body.templateCategory ?? null},
        ${body.cadence},
        ${body.nextRunOn}::date,
        ${active},
        ${accountId},
        ${budgetId},
        ${categoryId}
      )
      RETURNING
        id,
        user_id,
        template_kind,
        template_amount::text,
        template_category,
        cadence,
        next_run_on,
        active,
        created_at,
        label,
        account_id,
        budget_id,
        category_id
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeRecurringRule(row), { message: "Recurring rule created" });
  }
);
