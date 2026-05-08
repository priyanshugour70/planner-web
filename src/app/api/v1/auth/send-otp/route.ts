import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/server/auth/auth-service";
import { sendOtpBodySchema } from "@/server/auth/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "send_otp",
    auditType: "auth",
    rateLimit: { max: 15 },
    parseBody: sendOtpBodySchema,
  },
  async ({ body, requestId }) => {
    const data = await Auth.sendOtp(body);
    return jsonSuccess(requestId, data, { message: data.message });
  }
);
