import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { budgetPatchSchema, parseAmount } from "@/modules/finance/server/schemas";
import { serializeBudget, type BudgetRow } from "@/modules/finance/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/budgets\/(\d+)\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "budgets_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [row] = await sql<BudgetRow[]>`
      SELECT * FROM budgets WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Budget not found");
    return jsonSuccess(requestId, serializeBudget(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "budgets_patch", parseBody: budgetPatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [existing] = await sql<BudgetRow[]>`
      SELECT * FROM budgets WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Budget not found");

    const name = body.name !== undefined ? body.name : existing.name;
    const category = body.category !== undefined ? body.category : existing.category;
    const amountLimit =
      body.amountLimit !== undefined ? parseAmount(body.amountLimit) : existing.amount_limit;
    const periodStart =
      body.periodStart !== undefined ? body.periodStart : existing.period_start.toISOString().slice(0, 10);
    const periodEnd =
      body.periodEnd !== undefined ? body.periodEnd : existing.period_end.toISOString().slice(0, 10);
    const notes = body.notes !== undefined ? body.notes : existing.notes;

    const [row] = await sql<BudgetRow[]>`
      UPDATE budgets SET
        name = ${name},
        category = ${category},
        amount_limit = ${amountLimit}::numeric,
        period_start = ${periodStart},
        period_end = ${periodEnd},
        notes = ${notes}
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeBudget(row), { message: "Budget updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "budgets_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const rows = await sql`DELETE FROM budgets WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Budget not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Budget deleted" });
  }
);
