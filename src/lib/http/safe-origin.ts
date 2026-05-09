import type { NextRequest } from "next/server";
import { HttpError } from "@/modules/auth/server/http-error";

/**
 * Rejects cross-site refresh attempts when `Origin` is present and does not match the request host.
 * Browsers send Origin on cross-site POST; same-site cookie + this check mitigates CSRF refresh abuse.
 */
export function assertRefreshOriginAllowed(req: NextRequest): void {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("host");
  if (!host) return;
  let oHost: string;
  try {
    oHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "FORBIDDEN", "Invalid Origin header");
  }
  if (oHost !== host) {
    throw new HttpError(403, "FORBIDDEN", "Origin not allowed");
  }
}
