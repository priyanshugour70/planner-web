import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { habitCreateSchema } from "@/modules/habits/server/schemas";
import { serializeHabit, type HabitRow } from "@/modules/habits/server/serialize";
import { ErrorCodes } from "@/types/api-error";

export const GET = withApiRoute(
  { module: "planner", action: "habits_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();

    // Parse optional query params
    const archivedParam = req.nextUrl.searchParams.get("archived");
    const showArchived = archivedParam === "true";

    const rows = await sql<HabitRow[]>`
      SELECT * FROM habits
      WHERE user_id = ${auth.userId}
        AND archived = ${showArchived}
      ORDER BY name ASC
    `;

    return jsonSuccess(requestId, rows.map(serializeHabit));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "habits_create", parseBody: habitCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const customDays = body.customDays ?? [];
    const [row] = await sql<HabitRow[]>`
      INSERT INTO habits (user_id, name, description, color, icon, frequency, target_per_week, archived, reminder_time, start_date, goal_id, custom_days)
      VALUES (
        ${auth.userId},
        ${body.name},
        ${body.description ?? null},
        ${body.color ?? "#6366f1"},
        ${body.icon ?? "🎯"},
        ${body.frequency ?? "daily"}::habit_frequency,
        ${body.targetPerWeek ?? null},
        ${body.archived ?? false},
        ${body.reminderTime ?? null},
        ${body.startDate ?? new Date().toISOString().slice(0, 10)},
        ${body.goalId ? BigInt(body.goalId) : null},
        ${sql.array(customDays)}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeHabit(row), { message: "Habit created" });
  }
);
