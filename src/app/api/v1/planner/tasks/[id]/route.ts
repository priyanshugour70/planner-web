import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { taskPatchSchema } from "@/modules/tasks/server/schemas";
import { parseTaskTimestamptz } from "@/modules/tasks/server/task-datetime";
import { taskParentWouldCycle } from "@/modules/tasks/server/task-parent";
import { serializeTask, type TaskRow } from "@/modules/tasks/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const taskIdRe = /\/planner\/tasks\/(\d+)\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "tasks_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, taskIdRe);
    const sql = getSql();
    const [row] = await sql<TaskRow[]>`
      SELECT * FROM tasks WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Task not found");
    return jsonSuccess(requestId, serializeTask(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "tasks_patch", parseBody: taskPatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, taskIdRe);
    const sql = getSql();
    const [existing] = await sql<TaskRow[]>`
      SELECT * FROM tasks WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Task not found");

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

    let parentTaskId = existing.parent_task_id;
    if (body.parentTaskId !== undefined) {
      if (body.parentTaskId === null) parentTaskId = null;
      else {
        const pid = BigInt(body.parentTaskId);
        if (pid === id) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Task cannot be parent of itself");
        const [p] = await sql<TaskRow[]>`
          SELECT * FROM tasks WHERE id = ${pid} AND user_id = ${auth.userId} LIMIT 1
        `;
        if (!p) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid parent task");
        if (await taskParentWouldCycle(sql, auth.userId, id, pid)) {
          throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Parent would create a cycle in the task tree");
        }
        parentTaskId = pid;
      }
    }

    if (parentTaskId != null) {
      const [pr] = await sql<TaskRow[]>`
        SELECT goal_id FROM tasks WHERE id = ${parentTaskId} AND user_id = ${auth.userId} LIMIT 1
      `;
      if (pr?.goal_id != null) {
        if (goalId != null && pr.goal_id !== goalId) {
          throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "goalId must match the parent task's goal");
        }
        goalId = pr.goal_id;
      }
    }

    const title = body.title !== undefined ? body.title : existing.title;
    const description = body.description !== undefined ? body.description : existing.description;
    const status = body.status !== undefined ? body.status : existing.status;
    const priority = body.priority !== undefined ? body.priority : existing.priority;

    let dueAt: Date | null = existing.due_at;
    if (body.dueAt !== undefined) {
      if (body.dueAt === null) dueAt = null;
      else {
        const d = parseTaskTimestamptz(body.dueAt);
        if (!d) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid dueAt");
        dueAt = d;
      }
    }

    let completedAt: Date | null = existing.completed_at;
    if (body.completedAt !== undefined) {
      if (body.completedAt === null) completedAt = null;
      else {
        const c = parseTaskTimestamptz(body.completedAt);
        if (!c) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid completedAt");
        completedAt = c;
      }
    } else if (body.status !== undefined) {
      if (body.status === "done" && existing.status !== "done") {
        completedAt = new Date();
      } else if (existing.status === "done" && body.status !== "done") {
        completedAt = null;
      }
    }

    const tags = body.tags !== undefined ? body.tags : existing.tags;

    const [row] = await sql<TaskRow[]>`
      UPDATE tasks SET
        goal_id = ${goalId},
        parent_task_id = ${parentTaskId},
        title = ${title},
        description = ${description},
        status = ${status}::task_status,
        priority = ${priority},
        due_at = ${dueAt},
        completed_at = ${completedAt},
        tags = ${sql.array(tags)}
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeTask(row), { message: "Task updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "tasks_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, taskIdRe);
    const sql = getSql();
    const rows = await sql`DELETE FROM tasks WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Task not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Task deleted" });
  }
);
