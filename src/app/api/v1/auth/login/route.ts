import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/server/auth/auth-service";
import { loginBodySchema } from "@/server/auth/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "login",
    auditType: "auth",
    rateLimit: { max: 40 },
    parseBody: loginBodySchema,
  },
  async ({ body, requestId, req, ip, ua }) => {
    const data = await Auth.login(body, { userAgent: ua, ip });
    return jsonSuccess(requestId, data, {
      message: "Signed in",
      meta: { path: req.nextUrl.pathname },
    });
  }
);
