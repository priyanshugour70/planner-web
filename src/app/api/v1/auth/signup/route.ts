import { buildRefreshSetCookie } from "@/lib/auth/refresh-cookie";
import { jsonSuccess, withSetCookies } from "@/lib/api/response-builder";
import { withApiRoute } from "@/lib/api/with-api-route";
import { getServerEnv } from "@/lib/config/server-env";
import { isPlannerNativeClient } from "@/lib/http/planner-client";
import * as Auth from "@/modules/auth/server/auth-service";
import { signupBodySchema } from "@/modules/auth/server/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "signup",
    auditType: "auth",
    rateLimit: { max: 20 },
    parseBody: signupBodySchema,
  },
  async ({ body, requestId, req }) => {
    const data = await Auth.signup(body);
    const env = getServerEnv();
    const { refreshToken, ...publicData } = data;
    const publicPayload = isPlannerNativeClient(req) ? data : publicData;
    const res = jsonSuccess(requestId, publicPayload, { message: "Account created" });
    return withSetCookies(res, [buildRefreshSetCookie(env, refreshToken)]);
  }
);
