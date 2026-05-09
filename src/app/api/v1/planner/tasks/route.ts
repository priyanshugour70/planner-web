import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { taskCreateSchema, taskStatusSchema } from "@/modules/tasks/server/schemas";
import { serializeTask, type TaskRow } from "@/modules/tasks/server/serialize";
import { ErrorCodes } from "@/types/api-error";
import { z } from "zod";

const listQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  goalId: z.string().regex(/^\d+$/).optional(),
});

export const GET = withApiRoute(
  { module: "planner", action: "tasks_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const q = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = listQuerySchema.safeParse(q);
    if (!parsed.success) {
      throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid query", {
        issues: parsed.error.issues,
      });
    }
    const sql = getSql();
    const status = parsed.data.status;
    const goalId = parsed.data.goalId ? BigInt(parsed.data.goalId) : null;

    const rows =
      status != null && goalId != null
        ? await sql<TaskRow[]>`
            SELECT * FROM tasks
            WHERE user_id = ${auth.userId} AND status = ${status}::task_status AND goal_id = ${goalId}
            ORDER BY due_at NULLS LAST, updated_at DESC
          `
        : status != null
          ? await sql<TaskRow[]>`
              SELECT * FROM tasks
              WHERE user_id = ${auth.userId} AND status = ${status}::task_status
              ORDER BY due_at NULLS LAST, updated_at DESC
            `
          : goalId != null
            ? await sql<TaskRow[]>`
                SELECT * FROM tasks
                WHERE user_id = ${auth.userId} AND goal_id = ${goalId}
                ORDER BY due_at NULLS LAST, updated_at DESC
              `
            : await sql<TaskRow[]>`
                SELECT * FROM tasks WHERE user_id = ${auth.userId}
                ORDER BY due_at NULLS LAST, updated_at DESC
              `;

    return jsonSuccess(requestId, rows.map(serializeTask));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "tasks_create", parseBody: taskCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();

    let goalId: bigint | null = null;
    if (body.goalId) {
      goalId = BigInt(body.goalId);
      const [g] = await sql`SELECT id FROM goals WHERE id = ${goalId} AND user_id = ${auth.userId} LIMIT 1`;
      if (!g) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid goal");
    }

    let parentTaskId: bigint | null = null;
    if (body.parentTaskId) {
      parentTaskId = BigInt(body.parentTaskId);
      const [p] = await sql`
        SELECT id FROM tasks WHERE id = ${parentTaskId} AND user_id = ${auth.userId} LIMIT 1
      `;
      if (!p) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid parent task");
    }

    const tags = body.tags ?? [];
    const dueAt = body.dueAt ? new Date(body.dueAt) : null;

    const [row] = await sql<TaskRow[]>`
      INSERT INTO tasks (
        user_id, goal_id, parent_task_id, title, description, status, priority, due_at, tags
      )
      VALUES (
        ${auth.userId},
        ${goalId},
        ${parentTaskId},
        ${body.title},
        ${body.description ?? null},
        ${body.status ?? "todo"}::task_status,
        ${body.priority ?? 2},
        ${dueAt},
        ${sql.array(tags)}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeTask(row), { message: "Task created" });
  }
);
