import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql, type SqlClient } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { requireFinanceAccount, requireFinanceCategory } from "@/modules/finance/server/guards";
import { parseAmount, recurringRulePatchSchema } from "@/modules/finance/server/schemas";
import { serializeRecurringRule, type RecurringRuleRow } from "@/modules/finance/server/serialize";
import { isoDate } from "@/modules/shared/server/serialize-helpers";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/finance\/recurring-rules\/(\d+)\/?$/;

async function requireBudget(sql: SqlClient, userId: bigint, budgetId: bigint): Promise<void> {
  const [row] = await sql`SELECT id FROM budgets WHERE id = ${budgetId} AND user_id = ${userId} LIMIT 1`;
  if (!row) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid budget");
}

export const GET = withApiRoute(
  { module: "planner", action: "finance_recurring_rules_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [row] = await sql<RecurringRuleRow[]>`
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
      WHERE id = ${id} AND user_id = ${auth.userId}
      LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Rule not found");
    return jsonSuccess(requestId, serializeRecurringRule(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "finance_recurring_rules_patch", parseBody: recurringRulePatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [existing] = await sql<RecurringRuleRow[]>`
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
      WHERE id = ${id} AND user_id = ${auth.userId}
      LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Rule not found");

    const label = body.label !== undefined ? body.label : existing.label;
    const templateKind = body.templateKind !== undefined ? body.templateKind : existing.template_kind;
    const templateAmount =
      body.templateAmount !== undefined ? parseAmount(body.templateAmount) : existing.template_amount;
    const templateCategory =
      body.templateCategory !== undefined ? body.templateCategory : existing.template_category;
    const cadence = body.cadence !== undefined ? body.cadence : existing.cadence;
    const nextRunOn =
      body.nextRunOn !== undefined ? body.nextRunOn : (isoDate(existing.next_run_on) ?? undefined);
    if (!nextRunOn) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid nextRunOn");
    const active = body.active !== undefined ? body.active : existing.active;

    let accountId = existing.account_id;
    if (body.accountId !== undefined) {
      if (body.accountId === null) accountId = null;
      else {
        accountId = BigInt(body.accountId);
        await requireFinanceAccount(sql, auth.userId, accountId);
      }
    }
    let budgetId = existing.budget_id;
    if (body.budgetId !== undefined) {
      if (body.budgetId === null) budgetId = null;
      else {
        budgetId = BigInt(body.budgetId);
        await requireBudget(sql, auth.userId, budgetId);
      }
    }
    let categoryId = existing.category_id;
    if (body.categoryId !== undefined) {
      if (body.categoryId === null) categoryId = null;
      else {
        categoryId = BigInt(body.categoryId);
        await requireFinanceCategory(sql, auth.userId, categoryId);
      }
    }

    const [row] = await sql<RecurringRuleRow[]>`
      UPDATE recurring_transaction_rules SET
        label = ${label},
        template_kind = ${templateKind}::finance_tx_kind,
        template_amount = ${templateAmount}::numeric,
        template_category = ${templateCategory},
        cadence = ${cadence},
        next_run_on = ${nextRunOn}::date,
        active = ${active},
        account_id = ${accountId},
        budget_id = ${budgetId},
        category_id = ${categoryId}
      WHERE id = ${id} AND user_id = ${auth.userId}
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
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeRecurringRule(row), { message: "Rule updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "finance_recurring_rules_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const rows = await sql`DELETE FROM recurring_transaction_rules WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Rule not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Rule deleted" });
  }
);
