import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
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
    return jsonSuccess(requestId, data, { message: "Account created" });
  }
);
