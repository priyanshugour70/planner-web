import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { debtObligationCreateSchema, parseAmount } from "@/modules/finance/server/schemas";
import { serializeDebtObligation, type DebtObligationRow } from "@/modules/finance/server/serialize";
import { ErrorCodes } from "@/types/api-error";

export const GET = withApiRoute(
  { module: "planner", action: "debt_obligations_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const rows = await sql<DebtObligationRow[]>`
      SELECT * FROM debt_obligations WHERE user_id = ${auth.userId} ORDER BY due_date NULLS LAST, id DESC
    `;
    return jsonSuccess(requestId, rows.map(serializeDebtObligation));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "debt_obligations_create", parseBody: debtObligationCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const principal = parseAmount(body.principal);
    const balance = body.balance != null ? parseAmount(body.balance) : principal;
    const [row] = await sql<DebtObligationRow[]>`
      INSERT INTO debt_obligations (
        user_id, counterparty, direction, principal, balance, currency, due_date, status, notes
      )
      VALUES (
        ${auth.userId},
        ${body.counterparty},
        ${body.direction},
        ${principal}::numeric,
        ${balance}::numeric,
        ${body.currency},
        ${body.dueDate ?? null},
        ${body.status},
        ${body.notes ?? null}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeDebtObligation(row), { message: "Debt recorded" });
  }
);
