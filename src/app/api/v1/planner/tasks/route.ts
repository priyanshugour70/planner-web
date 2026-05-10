import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { taskCreateSchema, taskListQuerySchema } from "@/modules/tasks/server/schemas";
import { parseTaskTimestamptz } from "@/modules/tasks/server/task-datetime";
import { serializeTask, type TaskRow } from "@/modules/tasks/server/serialize";
import { ErrorCodes } from "@/types/api-error";

function likePattern(raw: string): string {
  const t = raw.trim();
  const escaped = t.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
  return `%${escaped}%`;
}

function orderByClause(sort: string): string {
  switch (sort) {
    case "priority":
      return "priority DESC, due_at NULLS LAST, updated_at DESC, id DESC";
    case "updated":
      return "updated_at DESC, id DESC";
    case "created":
      return "created_at DESC, id DESC";
    case "due":
    default:
      return "due_at NULLS LAST, priority DESC, updated_at DESC, id DESC";
  }
}

export const GET = withApiRoute(
  { module: "planner", action: "tasks_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const q = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = taskListQuerySchema.safeParse(q);
    if (!parsed.success) {
      throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid query", {
        issues: parsed.error.issues,
      });
    }
    const sql = getSql();
    const { status, goalId: goalIdStr, parentTaskId: parentStr, rootsOnly, q: titleQ, limit: lim, sort } = parsed.data;
    const limit = Math.min(500, Math.max(1, lim ?? 200));
    const goalId = goalIdStr ? BigInt(goalIdStr) : null;
    const parentTaskId = parentStr ? BigInt(parentStr) : null;
    const roots = rootsOnly === "true";
    const orderSql = orderByClause(sort ?? "due");

    const rows = await sql<TaskRow[]>`
      SELECT * FROM tasks
      WHERE user_id = ${auth.userId}
        ${status != null ? sql`AND status = ${status}::task_status` : sql``}
        ${goalId != null ? sql`AND goal_id = ${goalId}` : sql``}
        ${parentTaskId != null ? sql`AND parent_task_id = ${parentTaskId}` : sql``}
        ${roots && parentTaskId == null ? sql`AND parent_task_id IS NULL` : sql``}
        ${titleQ != null ? sql`AND title ILIKE ${likePattern(titleQ)} ESCAPE '\\'` : sql``}
      ORDER BY ${sql.unsafe(orderSql)}
      LIMIT ${limit}
    `;

    return jsonSuccess(requestId, rows.map(serializeTask));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "tasks_create", parseBody: taskCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();

    let goalId: bigint | null = body.goalId ? BigInt(body.goalId) : null;
    if (body.goalId) {
      const gid = goalId!;
      const [g] = await sql`SELECT id FROM goals WHERE id = ${gid} AND user_id = ${auth.userId} LIMIT 1`;
      if (!g) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid goal");
    }

    let parentTaskId: bigint | null = null;
    if (body.parentTaskId) {
      parentTaskId = BigInt(body.parentTaskId);
      const [p] = await sql<TaskRow[]>`
        SELECT * FROM tasks WHERE id = ${parentTaskId} AND user_id = ${auth.userId} LIMIT 1
      `;
      if (!p) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid parent task");
      if (p.goal_id != null) {
        if (goalId != null && p.goal_id !== goalId) {
          throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "goalId must match the parent task's goal");
        }
        goalId = p.goal_id;
      }
    }

    const tags = body.tags ?? [];
    let dueAt: Date | null = null;
    if (body.dueAt !== undefined && body.dueAt !== null) {
      dueAt = parseTaskTimestamptz(body.dueAt);
      if (!dueAt) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid dueAt");
    }

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
