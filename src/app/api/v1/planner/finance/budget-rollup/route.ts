import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/modules/auth/server/auth-service";
import { computeBudgetRollups } from "@/modules/finance/server/analytics";

export const GET = withApiRoute(
  { module: "planner", action: "finance_budget_rollup" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const rows = await computeBudgetRollups(auth.userId);
    return jsonSuccess(requestId, rows);
  }
);
