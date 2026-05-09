import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { financeAccountPatchSchema } from "@/modules/finance/server/schemas";
import { serializeFinanceAccount, type FinanceAccountRow } from "@/modules/finance/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/finance\/accounts\/(\d+)\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "finance_accounts_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [row] = await sql<FinanceAccountRow[]>`
      SELECT * FROM finance_accounts WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Account not found");
    return jsonSuccess(requestId, serializeFinanceAccount(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "finance_accounts_patch", parseBody: financeAccountPatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [existing] = await sql<FinanceAccountRow[]>`
      SELECT * FROM finance_accounts WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Account not found");

    const name = body.name !== undefined ? body.name : existing.name;
    const kind = body.kind !== undefined ? body.kind : existing.kind;
    const currency = body.currency !== undefined ? body.currency : existing.currency;

    const [row] = await sql<FinanceAccountRow[]>`
      UPDATE finance_accounts
      SET name = ${name}, kind = ${kind}, currency = ${currency}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeFinanceAccount(row), { message: "Account updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "finance_accounts_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const rows = await sql`DELETE FROM finance_accounts WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Account not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Account deleted" });
  }
);
