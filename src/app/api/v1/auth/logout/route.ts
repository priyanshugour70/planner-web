import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/server/auth/auth-service";
import { logoutBodySchema } from "@/server/auth/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "logout",
    auditType: "auth",
    rateLimit: { max: 60 },
    parseBody: logoutBodySchema,
  },
  async ({ body, requestId, req }) => {
    const data = await Auth.logout({
      accessToken: req.headers.get("authorization")?.startsWith("Bearer ")
        ? req.headers.get("authorization")!.slice("Bearer ".length).trim()
        : null,
      refreshToken: body.refreshToken ?? null,
    });
    return jsonSuccess(requestId, data, { message: "Signed out" });
  }
);
