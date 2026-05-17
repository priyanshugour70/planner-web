import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/modules/auth/server/auth-service";
import { computeJournalAnalytics, getPromptForDate } from "@/modules/journal/server/analytics";

/**
 * GET /api/v1/planner/journal/analytics
 * Returns journal analytics: mood distribution, writing streaks, word stats, monthly trends.
 */
export const GET = withApiRoute(
  { module: "planner", action: "journal_analytics" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const analytics = await computeJournalAnalytics(auth.userId);
    return jsonSuccess(requestId, {
      ...analytics,
      promptOfTheDay: getPromptForDate(),
    });
  }
);
