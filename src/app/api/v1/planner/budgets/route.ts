import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { budgetCreateSchema, parseAmount } from "@/modules/finance/server/schemas";
import { serializeBudget, type BudgetRow } from "@/modules/finance/server/serialize";
import { HttpError } from "@/modules/auth/server/http-error";
import { ErrorCodes } from "@/types/api-error";

export const GET = withApiRoute(
  { module: "planner", action: "budgets_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const rows = await sql<BudgetRow[]>`
      SELECT * FROM budgets WHERE user_id = ${auth.userId} ORDER BY period_start DESC, id DESC
    `;
    return jsonSuccess(requestId, rows.map(serializeBudget));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "budgets_create", parseBody: budgetCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const amt = parseAmount(body.amountLimit);
    const [row] = await sql<BudgetRow[]>`
      INSERT INTO budgets (user_id, name, category, amount_limit, period_start, period_end, notes)
      VALUES (
        ${auth.userId},
        ${body.name},
        ${body.category ?? null},
        ${amt}::numeric,
        ${body.periodStart},
        ${body.periodEnd},
        ${body.notes ?? null}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeBudget(row), { message: "Budget created" });
  }
);
