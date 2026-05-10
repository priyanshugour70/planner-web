import { buildRefreshSetCookie, readRefreshTokenFromCookie } from "@/lib/auth/refresh-cookie";
import { jsonSuccess, withSetCookies } from "@/lib/api/response-builder";
import { withApiRoute } from "@/lib/api/with-api-route";
import { getServerEnv } from "@/lib/config/server-env";
import { isPlannerNativeClient } from "@/lib/http/planner-client";
import { assertRefreshOriginAllowed } from "@/lib/http/safe-origin";
import * as Auth from "@/modules/auth/server/auth-service";
import { refreshBodySchema } from "@/modules/auth/server/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "refresh",
    auditType: "auth",
    rateLimit: { max: 120 },
    parseBody: refreshBodySchema,
  },
  async ({ body, requestId, req }) => {
    assertRefreshOriginAllowed(req);
    const env = getServerEnv();
    const fromCookie = readRefreshTokenFromCookie(req.headers.get("cookie"), env);
    const fromBody = body.refreshToken?.trim();
    const data = await Auth.refresh({ refreshToken: fromCookie ?? fromBody ?? null });
    const { refreshToken, ...publicData } = data;
    const publicPayload = isPlannerNativeClient(req) ? data : publicData;
    const res = jsonSuccess(requestId, publicPayload, { message: "Token refreshed" });
    return withSetCookies(res, [buildRefreshSetCookie(env, refreshToken)]);
  }
);
