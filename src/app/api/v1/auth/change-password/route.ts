import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import * as Auth from "@/modules/auth/server/auth-service";
import { changePasswordBodySchema } from "@/modules/auth/server/validators";

export const POST = withApiRoute(
  {
    module: "auth",
    action: "change_password",
    auditType: "security",
    rateLimit: { max: 20 },
    parseBody: changePasswordBodySchema,
  },
  async ({ body, requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const data = await Auth.changePassword({ userId: auth.userId }, body);
    return jsonSuccess(requestId, data, { message: data.message });
  }
);
