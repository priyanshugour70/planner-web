import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { requireFinanceCategory } from "@/modules/finance/server/guards";
import { financeCategoryCreateSchema } from "@/modules/finance/server/schemas";
import { serializeFinanceCategory, type FinanceCategoryRow } from "@/modules/finance/server/serialize";
import { ErrorCodes } from "@/types/api-error";

export const GET = withApiRoute(
  { module: "planner", action: "finance_categories_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const rows = await sql<FinanceCategoryRow[]>`
      SELECT * FROM finance_categories WHERE user_id = ${auth.userId} ORDER BY name ASC, id ASC
    `;
    return jsonSuccess(requestId, rows.map(serializeFinanceCategory));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "finance_categories_create", parseBody: financeCategoryCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    let parentId: bigint | null = null;
    if (body.parentId) {
      parentId = BigInt(body.parentId);
      await requireFinanceCategory(sql, auth.userId, parentId);
    }
    const [row] = await sql<FinanceCategoryRow[]>`
      INSERT INTO finance_categories (user_id, name, kind, parent_id)
      VALUES (${auth.userId}, ${body.name}, ${body.kind}, ${parentId})
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeFinanceCategory(row), { message: "Category created" });
  }
);
