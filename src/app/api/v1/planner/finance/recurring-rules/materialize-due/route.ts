import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/modules/auth/server/auth-service";
import { recurringMaterializeBodySchema } from "@/modules/finance/server/schemas";
import { materializeDueRecurringRules } from "@/modules/finance/server/recurring-materialize";
import { getSql } from "@/lib/db";

export const POST = withApiRoute(
  { module: "planner", action: "finance_recurring_rules_materialize", parseBody: recurringMaterializeBodySchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const through = body.throughDate ?? new Date().toISOString().slice(0, 10);
    const { createdIds } = await materializeDueRecurringRules(sql, auth.userId, through);
    return jsonSuccess(requestId, { createdTransactionIds: createdIds }, { message: "Materialized due recurring rules" });
  }
);
