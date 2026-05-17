import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { computeHabitAnalytics, computeHabitsSummary } from "@/modules/habits/server/analytics";
import type { HabitRow } from "@/modules/habits/server/serialize";

/**
 * GET /api/v1/planner/habits/analytics
 * Returns per-habit analytics + summary for the authenticated user.
 */
export const GET = withApiRoute(
  { module: "planner", action: "habits_analytics" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();

    const habits = await sql<HabitRow[]>`
      SELECT id FROM habits WHERE user_id = ${auth.userId} AND archived = FALSE
    `;

    const analytics = await Promise.all(
      habits.map((h) => computeHabitAnalytics(auth.userId, h.id))
    );

    const summary = await computeHabitsSummary(auth.userId);

    return jsonSuccess(requestId, { habits: analytics, summary });
  }
);
