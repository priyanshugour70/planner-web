import { buildRefreshSetCookie } from "@/lib/auth/refresh-cookie";
import { jsonSuccess, withSetCookies } from "@/lib/api/response-builder";
import { withApiRoute } from "@/lib/api/with-api-route";
import { getServerEnv } from "@/lib/config/server-env";
import { isPlannerNativeClient } from "@/lib/http/planner-client";
import * as Auth from "@/modules/auth/server/auth-service";
import { verifyOtpBodySchema } from "@/modules/auth/server/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "verify_otp",
    auditType: "auth",
    rateLimit: { max: 40 },
    parseBody: verifyOtpBodySchema,
  },
  async ({ body, requestId, req }) => {
    const data = await Auth.verifyOtp(body);
    if ("accessToken" in data && "refreshToken" in data && data.refreshToken) {
      const env = getServerEnv();
      const { refreshToken, ...publicData } = data;
      const publicPayload = isPlannerNativeClient(req) ? data : publicData;
      const res = jsonSuccess(requestId, publicPayload, { message: "OTP processed" });
      return withSetCookies(res, [buildRefreshSetCookie(env, refreshToken)]);
    }
    return jsonSuccess(requestId, data, { message: "OTP processed" });
  }
);
