import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/habits\/(\d+)\/entries\/(\d+)\/?$/;

export const DELETE = withApiRoute(
  { module: "planner", action: "habit_entries_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const m = req.nextUrl.pathname.match(re);
    if (!m?.[1] || !m?.[2]) {
      throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid path");
    }
    const habitId = BigInt(m[1]);
    const entryId = BigInt(m[2]);
    const sql = getSql();
    const [h] = await sql`SELECT id FROM habits WHERE id = ${habitId} AND user_id = ${auth.userId} LIMIT 1`;
    if (!h) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Habit not found");
    const rows = await sql`
      DELETE FROM habit_entries WHERE id = ${entryId} AND habit_id = ${habitId} RETURNING id
    `;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Entry not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Entry deleted" });
  }
);
