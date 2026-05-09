import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/modules/auth/server/auth-service";
import { forgotPasswordBodySchema } from "@/modules/auth/server/validators";

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
