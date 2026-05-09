import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { calendarEventCreateSchema } from "@/modules/calendar/server/schemas";
import { serializeCalendarEvent, type CalendarEventRow } from "@/modules/calendar/server/serialize";
import { ErrorCodes } from "@/types/api-error";
import { z } from "zod";

const listQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const GET = withApiRoute(
  { module: "planner", action: "calendar_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const q = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = listQuerySchema.safeParse(q);
    if (!parsed.success) {
      throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid query", {
        issues: parsed.error.issues,
      });
    }
    const now = Date.now();
    const from = parsed.data.from ? new Date(parsed.data.from) : new Date(now - 7 * 86400000);
    const to = parsed.data.to ? new Date(parsed.data.to) : new Date(now + 30 * 86400000);
    const sql = getSql();
    const rows = await sql<CalendarEventRow[]>`
      SELECT * FROM calendar_events
      WHERE user_id = ${auth.userId}
        AND starts_at < ${to}
        AND ends_at > ${from}
      ORDER BY starts_at ASC
    `;
    return jsonSuccess(requestId, rows.map(serializeCalendarEvent));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "calendar_create", parseBody: calendarEventCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    if (endsAt < startsAt) {
      throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "endsAt must be >= startsAt");
    }

    let taskId: bigint | null = null;
    if (body.taskId) {
      taskId = BigInt(body.taskId);
      const [t] = await sql`SELECT id FROM tasks WHERE id = ${taskId} AND user_id = ${auth.userId} LIMIT 1`;
      if (!t) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid task");
    }
    let goalId: bigint | null = null;
    if (body.goalId) {
      goalId = BigInt(body.goalId);
      const [g] = await sql`SELECT id FROM goals WHERE id = ${goalId} AND user_id = ${auth.userId} LIMIT 1`;
      if (!g) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid goal");
    }

    const [row] = await sql<CalendarEventRow[]>`
      INSERT INTO calendar_events (
        user_id, title, description, location, starts_at, ends_at, all_day, color, task_id, goal_id
      )
      VALUES (
        ${auth.userId},
        ${body.title},
        ${body.description ?? null},
        ${body.location ?? null},
        ${startsAt},
        ${endsAt},
        ${body.allDay ?? false},
        ${body.color ?? "#0ea5e9"},
        ${taskId},
        ${goalId}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeCalendarEvent(row), { message: "Event created" });
  }
);
