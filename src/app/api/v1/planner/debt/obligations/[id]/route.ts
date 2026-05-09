import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { debtObligationPatchSchema, parseAmount } from "@/modules/finance/server/schemas";
import { serializeDebtObligation, type DebtObligationRow } from "@/modules/finance/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/debt\/obligations\/(\d+)\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "debt_obligations_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [row] = await sql<DebtObligationRow[]>`
      SELECT * FROM debt_obligations WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Obligation not found");
    return jsonSuccess(requestId, serializeDebtObligation(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "debt_obligations_patch", parseBody: debtObligationPatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [existing] = await sql<DebtObligationRow[]>`
      SELECT * FROM debt_obligations WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Obligation not found");

    const counterparty = body.counterparty !== undefined ? body.counterparty : existing.counterparty;
    const direction = body.direction !== undefined ? body.direction : existing.direction;
    const principal =
      body.principal !== undefined ? parseAmount(body.principal) : existing.principal;
    const balance = body.balance !== undefined ? parseAmount(body.balance) : existing.balance;
    const currency = body.currency !== undefined ? body.currency : existing.currency;
    let dueDateForSql: string | null;
    if (body.dueDate !== undefined) {
      dueDateForSql = body.dueDate;
    } else {
      dueDateForSql = existing.due_date ? existing.due_date.toISOString().slice(0, 10) : null;
    }
    const status = body.status !== undefined ? body.status : existing.status;
    const notes = body.notes !== undefined ? body.notes : existing.notes;

    const [row] = await sql<DebtObligationRow[]>`
      UPDATE debt_obligations SET
        counterparty = ${counterparty},
        direction = ${direction},
        principal = ${principal}::numeric,
        balance = ${balance}::numeric,
        currency = ${currency},
        due_date = ${dueDateForSql},
        status = ${status},
        notes = ${notes},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeDebtObligation(row), { message: "Obligation updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "debt_obligations_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const rows = await sql`DELETE FROM debt_obligations WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Obligation not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Obligation deleted" });
  }
);
