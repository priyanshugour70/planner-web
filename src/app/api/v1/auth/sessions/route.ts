import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/modules/auth/server/auth-service";

export const GET = withApiRoute(
  {
    module: "auth",
    action: "sessions_list",
    auditType: "auth",
    rateLimit: { max: 120 },
  },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const data = await Auth.listSessions({ userId: auth.userId });
    return jsonSuccess(requestId, { sessions: data }, { message: "Sessions" });
  }
);
