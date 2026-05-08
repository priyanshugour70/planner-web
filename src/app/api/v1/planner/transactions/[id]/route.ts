import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { bigIntPathId } from "@/server/planner/path-ids";
import { parseAmount, transactionPatchSchema } from "@/server/planner/schemas";
import { serializeTransaction, type TransactionRow } from "@/server/planner/serialize";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/transactions\/(\d+)\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "transactions_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [row] = await sql<TransactionRow[]>`
      SELECT * FROM transactions WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Transaction not found");
    return jsonSuccess(requestId, serializeTransaction(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "transactions_patch", parseBody: transactionPatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [existing] = await sql<TransactionRow[]>`
      SELECT * FROM transactions WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Transaction not found");

    let budgetId = existing.budget_id;
    if (body.budgetId !== undefined) {
      if (body.budgetId === null) budgetId = null;
      else {
        const bid = BigInt(body.budgetId);
        const [b] = await sql`SELECT id FROM budgets WHERE id = ${bid} AND user_id = ${auth.userId} LIMIT 1`;
        if (!b) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid budget");
        budgetId = bid;
      }
    }

    const kind = body.kind !== undefined ? body.kind : existing.kind;
    const amount = body.amount !== undefined ? parseAmount(body.amount) : existing.amount;
    const category = body.category !== undefined ? body.category : existing.category;
    const note = body.note !== undefined ? body.note : existing.note;
    const occurredOn =
      body.occurredOn !== undefined ? body.occurredOn : existing.occurred_on.toISOString().slice(0, 10);

    const [row] = await sql<TransactionRow[]>`
      UPDATE transactions SET
        budget_id = ${budgetId},
        kind = ${kind}::finance_tx_kind,
        amount = ${amount}::numeric,
        category = ${category},
        note = ${note},
        occurred_on = ${occurredOn}
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeTransaction(row), { message: "Transaction updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "transactions_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const rows = await sql`DELETE FROM transactions WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Transaction not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Transaction deleted" });
  }
);
