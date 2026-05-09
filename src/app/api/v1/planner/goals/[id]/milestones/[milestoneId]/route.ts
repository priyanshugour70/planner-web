import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { milestonePatchSchema } from "@/modules/goals/server/schemas";
import { serializeMilestone, type MilestoneRow } from "@/modules/goals/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const oneRe = /\/planner\/goals\/(\d+)\/milestones\/(\d+)\/?$/;

function ids(req: import("next/server").NextRequest): { goalId: bigint; milestoneId: bigint } {
  const m = req.nextUrl.pathname.match(oneRe);
  if (!m?.[1] || !m?.[2]) {
    throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid path");
  }
  return { goalId: BigInt(m[1]), milestoneId: BigInt(m[2]) };
}

export const PATCH = withApiRoute(
  { module: "planner", action: "milestones_patch", parseBody: milestonePatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const { goalId, milestoneId } = ids(req);
    const sql = getSql();
    const [g] = await sql`SELECT id FROM goals WHERE id = ${goalId} AND user_id = ${auth.userId} LIMIT 1`;
    if (!g) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Goal not found");
    const [existing] = await sql<MilestoneRow[]>`
      SELECT * FROM milestones WHERE id = ${milestoneId} AND goal_id = ${goalId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Milestone not found");

    const title = body.title !== undefined ? body.title : existing.title;
    const dueDate = body.dueDate !== undefined ? body.dueDate : existing.due_date?.toISOString().slice(0, 10) ?? null;
    const sortOrder = body.sortOrder !== undefined ? body.sortOrder : existing.sort_order;
    let completedAt: Date | null = existing.completed_at;
    if (body.completedAt !== undefined) {
      completedAt = body.completedAt ? new Date(body.completedAt) : null;
    }

    const [row] = await sql<MilestoneRow[]>`
      UPDATE milestones SET
        title = ${title},
        due_date = ${dueDate},
        sort_order = ${sortOrder},
        completed_at = ${completedAt}
      WHERE id = ${milestoneId} AND goal_id = ${goalId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeMilestone(row), { message: "Milestone updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "milestones_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const { goalId, milestoneId } = ids(req);
    const sql = getSql();
    const [g] = await sql`SELECT id FROM goals WHERE id = ${goalId} AND user_id = ${auth.userId} LIMIT 1`;
    if (!g) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Goal not found");
    const rows = await sql`
      DELETE FROM milestones WHERE id = ${milestoneId} AND goal_id = ${goalId} RETURNING id
    `;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Milestone not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Milestone deleted" });
  }
);
