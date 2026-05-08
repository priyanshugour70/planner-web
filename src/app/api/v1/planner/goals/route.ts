import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { goalCreateSchema, goalStatusSchema } from "@/server/planner/schemas";
import { serializeGoal, type GoalRow } from "@/server/planner/serialize";
import { ErrorCodes } from "@/types/api-error";
import { z } from "zod";

const listQuerySchema = z.object({
  status: goalStatusSchema.optional(),
});

export const GET = withApiRoute(
  { module: "planner", action: "goals_list" },
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
    const rows =
      parsed.data.status != null
        ? await sql`
            SELECT * FROM goals
            WHERE user_id = ${auth.userId} AND status = ${parsed.data.status}::goal_status
            ORDER BY updated_at DESC
          `
        : await sql`
            SELECT * FROM goals WHERE user_id = ${auth.userId} ORDER BY updated_at DESC
          `;
    return jsonSuccess(requestId, (rows as unknown as GoalRow[]).map(serializeGoal));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "goals_create", parseBody: goalCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const [row] = await sql`
      INSERT INTO goals (user_id, title, description, status, priority, target_date, progress)
      VALUES (
        ${auth.userId},
        ${body.title},
        ${body.description ?? null},
        ${body.status ?? "active"}::goal_status,
        ${body.priority ?? 2},
        ${body.targetDate ?? null},
        ${body.progress ?? 0}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeGoal(row as GoalRow), {
      message: "Goal created",
    });
  }
);
