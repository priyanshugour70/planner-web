import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { computeFinanceSummary } from "@/modules/finance/server/analytics";
import * as Auth from "@/server/auth/auth-service";

export const GET = withApiRoute(
  { module: "planner", action: "finance_summary" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const summary = await computeFinanceSummary(auth.userId);
    return jsonSuccess(requestId, summary);
  }
);
