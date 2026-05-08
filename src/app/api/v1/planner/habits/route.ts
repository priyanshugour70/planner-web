import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { habitCreateSchema } from "@/server/planner/schemas";
import { serializeHabit, type HabitRow } from "@/server/planner/serialize";
import { ErrorCodes } from "@/types/api-error";

export const GET = withApiRoute(
  { module: "planner", action: "habits_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const rows = await sql<HabitRow[]>`
      SELECT * FROM habits WHERE user_id = ${auth.userId} ORDER BY name ASC
    `;
    return jsonSuccess(requestId, rows.map(serializeHabit));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "habits_create", parseBody: habitCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const [row] = await sql<HabitRow[]>`
      INSERT INTO habits (user_id, name, description, color, frequency, target_per_week)
      VALUES (
        ${auth.userId},
        ${body.name},
        ${body.description ?? null},
        ${body.color ?? "#6366f1"},
        ${body.frequency ?? "daily"}::habit_frequency,
        ${body.targetPerWeek ?? null}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeHabit(row), { message: "Habit created" });
  }
);
