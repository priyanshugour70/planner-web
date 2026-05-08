import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/server/auth/auth-service";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "sessions_revoke_others",
    auditType: "security",
    rateLimit: { max: 30 },
  },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const data = await Auth.revokeOtherSessions({
      userId: auth.userId,
      currentSessionId: auth.sessionId,
    });
    return jsonSuccess(requestId, data, { message: "Other sessions revoked" });
  }
);
