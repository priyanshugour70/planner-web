import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { financeAccountCreateSchema } from "@/modules/finance/server/schemas";
import { serializeFinanceAccount, type FinanceAccountRow } from "@/modules/finance/server/serialize";
import { HttpError } from "@/modules/auth/server/http-error";
import { ErrorCodes } from "@/types/api-error";

export const GET = withApiRoute(
  { module: "planner", action: "finance_accounts_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const rows = await sql<FinanceAccountRow[]>`
      SELECT * FROM finance_accounts WHERE user_id = ${auth.userId} ORDER BY name ASC, id ASC
    `;
    return jsonSuccess(requestId, rows.map(serializeFinanceAccount));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "finance_accounts_create", parseBody: financeAccountCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const [row] = await sql<FinanceAccountRow[]>`
      INSERT INTO finance_accounts (user_id, name, kind, currency)
      VALUES (${auth.userId}, ${body.name}, ${body.kind}, ${body.currency})
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeFinanceAccount(row), { message: "Account created" });
  }
);
