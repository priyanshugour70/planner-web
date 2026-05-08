import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/server/auth/auth-service";
import { refreshBodySchema } from "@/server/auth/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "refresh",
    auditType: "auth",
    rateLimit: { max: 120 },
    parseBody: refreshBodySchema,
  },
  async ({ body, requestId }) => {
    const data = await Auth.refresh(body);
    return jsonSuccess(requestId, data, { message: "Token refreshed" });
  }
);
