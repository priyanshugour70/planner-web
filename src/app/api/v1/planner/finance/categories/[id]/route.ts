import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { requireFinanceCategory } from "@/modules/finance/server/guards";
import { financeCategoryPatchSchema } from "@/modules/finance/server/schemas";
import { serializeFinanceCategory, type FinanceCategoryRow } from "@/modules/finance/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/finance\/categories\/(\d+)\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "finance_categories_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [row] = await sql<FinanceCategoryRow[]>`
      SELECT * FROM finance_categories WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Category not found");
    return jsonSuccess(requestId, serializeFinanceCategory(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "finance_categories_patch", parseBody: financeCategoryPatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [existing] = await sql<FinanceCategoryRow[]>`
      SELECT * FROM finance_categories WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Category not found");

    let parentId = existing.parent_id;
    if (body.parentId !== undefined) {
      if (body.parentId === null) parentId = null;
      else {
        const pid = BigInt(body.parentId);
        if (pid === id) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Category cannot be its own parent");
        await requireFinanceCategory(sql, auth.userId, pid);
        parentId = pid;
      }
    }

    const name = body.name !== undefined ? body.name : existing.name;
    const kind = body.kind !== undefined ? body.kind : existing.kind;

    const [row] = await sql<FinanceCategoryRow[]>`
      UPDATE finance_categories SET name = ${name}, kind = ${kind}, parent_id = ${parentId}
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeFinanceCategory(row), { message: "Category updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "finance_categories_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const rows = await sql`DELETE FROM finance_categories WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Category not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Category deleted" });
  }
);
