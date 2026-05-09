import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { HttpError } from "@/modules/auth/server/http-error";
import * as Auth from "@/modules/auth/server/auth-service";

function sessionIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/sessions\/([^/]+)\/?$/);
  return m?.[1] ?? null;
}

export const DELETE = withApiRoute(
  {
    module: "auth",
    action: "sessions_revoke_one",
    auditType: "security",
    rateLimit: { max: 60 },
  },
  async ({ requestId, req }) => {
    const sessionId = sessionIdFromPath(req.nextUrl.pathname);
    if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
      throw new HttpError(400, "VALIDATION_ERROR", "Invalid session id");
    }
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const data = await Auth.revokeSession({
      userId: auth.userId,
      sessionId,
    });
    return jsonSuccess(requestId, data, { message: "Session revoked" });
  }
);
