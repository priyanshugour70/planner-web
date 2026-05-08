import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/server/auth/auth-service";
import { forgotPasswordBodySchema } from "@/server/auth/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "forgot_password",
    auditType: "auth",
    rateLimit: { max: 10 },
    parseBody: forgotPasswordBodySchema,
  },
  async ({ body, requestId }) => {
    const data = await Auth.forgotPassword(body);
    return jsonSuccess(requestId, data, { message: data.message });
  }
);
