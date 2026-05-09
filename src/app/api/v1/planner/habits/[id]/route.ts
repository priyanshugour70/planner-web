import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { habitPatchSchema } from "@/modules/habits/server/schemas";
import { serializeHabit, type HabitRow } from "@/modules/habits/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/habits\/(\d+)\/?$/;

async function habitOwned(userId: bigint, id: bigint) {
  const sql = getSql();
  const [row] = await sql<HabitRow[]>`
    SELECT * FROM habits WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `;
  return row ?? null;
}

export const GET = withApiRoute(
  { module: "planner", action: "habits_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const row = await habitOwned(auth.userId, id);
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Habit not found");
    return jsonSuccess(requestId, serializeHabit(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "habits_patch", parseBody: habitPatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const existing = await habitOwned(auth.userId, id);
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Habit not found");

    const name = body.name !== undefined ? body.name : existing.name;
    const description = body.description !== undefined ? body.description : existing.description;
    const color = body.color !== undefined ? body.color : existing.color;
    const frequency = body.frequency !== undefined ? body.frequency : existing.frequency;
    const targetPerWeek =
      body.targetPerWeek !== undefined ? body.targetPerWeek : existing.target_per_week;

    const [row] = await sql<HabitRow[]>`
      UPDATE habits SET
        name = ${name},
        description = ${description},
        color = ${color},
        frequency = ${frequency}::habit_frequency,
        target_per_week = ${targetPerWeek}
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeHabit(row), { message: "Habit updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "habits_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const rows = await sql`DELETE FROM habits WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Habit not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Habit deleted" });
  }
);
