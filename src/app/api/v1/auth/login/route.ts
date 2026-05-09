import { buildRefreshSetCookie } from "@/lib/auth/refresh-cookie";
import { jsonSuccess, withSetCookies } from "@/lib/api/response-builder";
import { withApiRoute } from "@/lib/api/with-api-route";
import { getServerEnv } from "@/lib/config/server-env";
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
    const env = getServerEnv();
    const { refreshToken, ...publicData } = data;
    const res = jsonSuccess(requestId, publicData, {
      message: "Signed in",
      meta: { path: req.nextUrl.pathname },
    });
    return withSetCookies(res, [buildRefreshSetCookie(env, refreshToken)]);
  }
);
