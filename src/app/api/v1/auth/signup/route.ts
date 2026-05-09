import { buildRefreshSetCookie } from "@/lib/auth/refresh-cookie";
import { jsonSuccess, withSetCookies } from "@/lib/api/response-builder";
import { withApiRoute } from "@/lib/api/with-api-route";
import { getServerEnv } from "@/lib/config/server-env";
import * as Auth from "@/server/auth/auth-service";
import { signupBodySchema } from "@/server/auth/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "signup",
    auditType: "auth",
    rateLimit: { max: 20 },
    parseBody: signupBodySchema,
  },
  async ({ body, requestId }) => {
    const data = await Auth.signup(body);
    const env = getServerEnv();
    const { refreshToken, ...publicData } = data;
    const res = jsonSuccess(requestId, publicData, { message: "Account created" });
    return withSetCookies(res, [buildRefreshSetCookie(env, refreshToken)]);
  }
);
