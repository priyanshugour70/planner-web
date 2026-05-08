import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/server/auth/auth-service";
import { resetPasswordBodySchema } from "@/server/auth/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "reset_password",
    auditType: "auth",
    rateLimit: { max: 20 },
    parseBody: resetPasswordBodySchema,
  },
  async ({ body, requestId }) => {
    const data = await Auth.resetPassword(body);
    return jsonSuccess(requestId, data, { message: data.message });
  }
);
