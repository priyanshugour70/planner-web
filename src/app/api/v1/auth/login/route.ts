import { buildRefreshSetCookie } from "@/lib/auth/refresh-cookie";
import { jsonSuccess, withSetCookies } from "@/lib/api/response-builder";
import { withApiRoute } from "@/lib/api/with-api-route";
import { getServerEnv } from "@/lib/config/server-env";
import { isPlannerNativeClient } from "@/lib/http/planner-client";
import * as Auth from "@/modules/auth/server/auth-service";
import { loginBodySchema } from "@/modules/auth/server/validators";

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
    const env = getServerEnv();
    const { refreshToken, ...publicData } = data;
    const publicPayload = isPlannerNativeClient(req) ? data : publicData;
    const res = jsonSuccess(requestId, publicPayload, {
      message: "Signed in",
      meta: { path: req.nextUrl.pathname },
    });
    return withSetCookies(res, [buildRefreshSetCookie(env, refreshToken)]);
  }
);
