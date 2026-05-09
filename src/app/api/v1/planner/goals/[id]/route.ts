import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { goalPatchSchema } from "@/modules/goals/server/schemas";
import { serializeGoal, type GoalRow } from "@/modules/goals/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const goalIdRe = /\/planner\/goals\/(\d+)\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "goals_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, goalIdRe);
    const sql = getSql();
    const [row] = await sql<GoalRow[]>`
      SELECT * FROM goals WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Goal not found");
    return jsonSuccess(requestId, serializeGoal(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "goals_patch", parseBody: goalPatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, goalIdRe);
    const sql = getSql();
    const [existing] = await sql<GoalRow[]>`
      SELECT * FROM goals WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Goal not found");

    const title = body.title !== undefined ? body.title : existing.title;
    const description = body.description !== undefined ? body.description : existing.description;
    const status = body.status !== undefined ? body.status : existing.status;
    const priority = body.priority !== undefined ? body.priority : existing.priority;
    const targetDate =
      body.targetDate !== undefined ? body.targetDate : existing.target_date?.toISOString().slice(0, 10) ?? null;
    const progress = body.progress !== undefined ? body.progress : existing.progress;

    const [row] = await sql<GoalRow[]>`
      UPDATE goals SET
        title = ${title},
        description = ${description},
        status = ${status}::goal_status,
        priority = ${priority},
        target_date = ${targetDate},
        progress = ${progress}
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeGoal(row), { message: "Goal updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "goals_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, goalIdRe);
    const sql = getSql();
    const rows = await sql`
      DELETE FROM goals WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id
    `;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Goal not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Goal deleted" });
  }
);
