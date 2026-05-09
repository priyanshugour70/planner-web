import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/modules/auth/server/auth-service";

export const GET = withApiRoute(
  {
    module: "auth",
    action: "me",
    auditType: "auth",
    rateLimit: { max: 200 },
  },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const data = await Auth.getMe({ userId: auth.userId });
    return jsonSuccess(requestId, data, { message: "Current user" });
  }
);
