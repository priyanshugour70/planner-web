import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/server/auth/auth-service";
import { verifyOtpBodySchema } from "@/server/auth/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "verify_otp",
    auditType: "auth",
    rateLimit: { max: 40 },
    parseBody: verifyOtpBodySchema,
  },
  async ({ body, requestId }) => {
    const data = await Auth.verifyOtp(body);
    return jsonSuccess(requestId, data, { message: "OTP processed" });
  }
);
