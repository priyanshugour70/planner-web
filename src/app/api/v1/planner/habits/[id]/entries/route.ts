import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { habitEntryCreateSchema } from "@/server/planner/schemas";
import { serializeHabitEntry, type HabitEntryRow } from "@/server/planner/serialize";
import { ErrorCodes } from "@/types/api-error";

const listRe = /\/planner\/habits\/(\d+)\/entries\/?$/;

function habitId(req: import("next/server").NextRequest): bigint {
  const m = req.nextUrl.pathname.match(listRe);
  if (!m?.[1]) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid habit id");
  return BigInt(m[1]);
}

export const GET = withApiRoute(
  { module: "planner", action: "habit_entries_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const hid = habitId(req);
    const sql = getSql();
    const [h] = await sql`SELECT id FROM habits WHERE id = ${hid} AND user_id = ${auth.userId} LIMIT 1`;
    if (!h) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Habit not found");
    const rows = await sql<HabitEntryRow[]>`
      SELECT * FROM habit_entries WHERE habit_id = ${hid} ORDER BY entry_date DESC
    `;
    return jsonSuccess(requestId, rows.map(serializeHabitEntry));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "habit_entries_create", parseBody: habitEntryCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const hid = habitId(req);
    const sql = getSql();
    const [h] = await sql`SELECT id FROM habits WHERE id = ${hid} AND user_id = ${auth.userId} LIMIT 1`;
    if (!h) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Habit not found");

    const [row] = await sql<HabitEntryRow[]>`
      INSERT INTO habit_entries (habit_id, entry_date, count, note)
      VALUES (${hid}, ${body.entryDate}, ${body.count ?? 1}, ${body.note ?? null})
      ON CONFLICT (habit_id, entry_date)
      DO UPDATE SET count = EXCLUDED.count, note = EXCLUDED.note
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Save failed");
    return jsonSuccess(requestId, serializeHabitEntry(row), { message: "Habit entry saved" });
  }
);
