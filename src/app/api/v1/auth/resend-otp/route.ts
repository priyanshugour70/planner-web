import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/modules/auth/server/auth-service";
import { resendOtpBodySchema } from "@/modules/auth/server/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "resend_otp",
    auditType: "auth",
    rateLimit: { max: 15 },
    parseBody: resendOtpBodySchema,
  },
  async ({ body, requestId }) => {
    const data = await Auth.sendOtp(body);
    return jsonSuccess(requestId, data, { message: data.message });
  }
);
