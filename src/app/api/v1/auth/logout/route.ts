import { buildRefreshClearCookie, readRefreshTokenFromCookie } from "@/lib/auth/refresh-cookie";
import { jsonSuccess, withSetCookies } from "@/lib/api/response-builder";
import { withApiRoute } from "@/lib/api/with-api-route";
import { getServerEnv } from "@/lib/config/server-env";
import * as Auth from "@/modules/auth/server/auth-service";
import { logoutBodySchema } from "@/modules/auth/server/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "logout",
    auditType: "auth",
    rateLimit: { max: 60 },
    parseBody: logoutBodySchema,
  },
  async ({ body, requestId, req }) => {
    const env = getServerEnv();
    const fromCookie = readRefreshTokenFromCookie(req.headers.get("cookie"), env);
    const data = await Auth.logout({
      accessToken: req.headers.get("authorization")?.startsWith("Bearer ")
        ? req.headers.get("authorization")!.slice("Bearer ".length).trim()
        : null,
      refreshToken: fromCookie ?? body.refreshToken ?? null,
    });
    const res = jsonSuccess(requestId, data, { message: "Signed out" });
    return withSetCookies(res, [buildRefreshClearCookie(env)]);
  }
);
