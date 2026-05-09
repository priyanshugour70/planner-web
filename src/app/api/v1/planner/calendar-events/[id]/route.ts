import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { calendarEventPatchSchema } from "@/modules/calendar/server/schemas";
import { serializeCalendarEvent, type CalendarEventRow } from "@/modules/calendar/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/calendar-events\/(\d+)\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "calendar_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [row] = await sql<CalendarEventRow[]>`
      SELECT * FROM calendar_events WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Event not found");
    return jsonSuccess(requestId, serializeCalendarEvent(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "calendar_patch", parseBody: calendarEventPatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [existing] = await sql<CalendarEventRow[]>`
      SELECT * FROM calendar_events WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Event not found");

    const title = body.title !== undefined ? body.title : existing.title;
    const description = body.description !== undefined ? body.description : existing.description;
    const location = body.location !== undefined ? body.location : existing.location;
    const startsAt =
      body.startsAt !== undefined ? new Date(body.startsAt) : existing.starts_at;
    const endsAt = body.endsAt !== undefined ? new Date(body.endsAt) : existing.ends_at;
    if (endsAt < startsAt) {
      throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "endsAt must be >= startsAt");
    }
    const allDay = body.allDay !== undefined ? body.allDay : existing.all_day;
    const color = body.color !== undefined ? body.color : existing.color;

    let taskId = existing.task_id;
    if (body.taskId !== undefined) {
      if (body.taskId === null) taskId = null;
      else {
        const tid = BigInt(body.taskId);
        const [t] = await sql`SELECT id FROM tasks WHERE id = ${tid} AND user_id = ${auth.userId} LIMIT 1`;
        if (!t) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid task");
        taskId = tid;
      }
    }

    let goalId = existing.goal_id;
    if (body.goalId !== undefined) {
      if (body.goalId === null) goalId = null;
      else {
        const gid = BigInt(body.goalId);
        const [g] = await sql`SELECT id FROM goals WHERE id = ${gid} AND user_id = ${auth.userId} LIMIT 1`;
        if (!g) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid goal");
        goalId = gid;
      }
    }

    const [row] = await sql<CalendarEventRow[]>`
      UPDATE calendar_events SET
        title = ${title},
        description = ${description},
        location = ${location},
        starts_at = ${startsAt},
        ends_at = ${endsAt},
        all_day = ${allDay},
        color = ${color},
        task_id = ${taskId},
        goal_id = ${goalId}
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeCalendarEvent(row), { message: "Event updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "calendar_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const rows = await sql`DELETE FROM calendar_events WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Event not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Event deleted" });
  }
);
