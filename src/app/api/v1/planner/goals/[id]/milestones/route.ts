import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { milestoneCreateSchema } from "@/modules/goals/server/schemas";
import { serializeMilestone, type MilestoneRow } from "@/modules/goals/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const listRe = /\/planner\/goals\/(\d+)\/milestones\/?$/;

function goalId(req: import("next/server").NextRequest): bigint {
  const m = req.nextUrl.pathname.match(listRe);
  if (!m?.[1]) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid goal id");
  return BigInt(m[1]);
}

export const GET = withApiRoute(
  { module: "planner", action: "milestones_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const gid = goalId(req);
    const sql = getSql();
    const [g] = await sql`SELECT id FROM goals WHERE id = ${gid} AND user_id = ${auth.userId} LIMIT 1`;
    if (!g) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Goal not found");
    const rows = await sql<MilestoneRow[]>`
      SELECT * FROM milestones WHERE goal_id = ${gid} ORDER BY sort_order ASC, id ASC
    `;
    return jsonSuccess(requestId, rows.map(serializeMilestone));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "milestones_create", parseBody: milestoneCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const gid = goalId(req);
    const sql = getSql();
    const [g] = await sql`SELECT id FROM goals WHERE id = ${gid} AND user_id = ${auth.userId} LIMIT 1`;
    if (!g) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Goal not found");
    const [row] = await sql<MilestoneRow[]>`
      INSERT INTO milestones (goal_id, title, due_date, sort_order)
      VALUES (${gid}, ${body.title}, ${body.dueDate ?? null}, ${body.sortOrder ?? 0})
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeMilestone(row), { message: "Milestone created" });
  }
);
