import "server-only";
import type { ServerEnv } from "@/lib/config/server-env";

/** Cookie name must match `REFRESH_COOKIE_NAME` in server env (default `planner_refresh`). */
export function refreshCookieName(env: ServerEnv): string {
  return env.REFRESH_COOKIE_NAME;
}

function secureFlag(env: ServerEnv): string {
  return env.NODE_ENV === "production" ? "Secure" : "";
}

/**
 * httpOnly refresh cookie. SameSite=Lax reduces CSRF on cross-site POSTs;
 * refresh is only accepted from same-site + optional Origin check in route.
 */
export function buildRefreshSetCookie(env: ServerEnv, rawRefreshToken: string): string {
  const name = refreshCookieName(env);
  const maxAge = env.REFRESH_TOKEN_TTL_SECONDS;
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(rawRefreshToken)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  const sec = secureFlag(env);
  if (sec) parts.push(sec);
  return parts.join("; ");
}

export function buildRefreshClearCookie(env: ServerEnv): string {
  const name = refreshCookieName(env);
  const parts = [
    `${encodeURIComponent(name)}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];
  const sec = secureFlag(env);
  if (sec) parts.push(sec);
  return parts.join("; ");
}

export function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader?.trim()) return {};
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = decodeURIComponent(part.slice(0, idx).trim());
    const v = decodeURIComponent(part.slice(idx + 1).trim());
    out[k] = v;
  }
  return out;
}

export function readRefreshTokenFromCookie(cookieHeader: string | null, env: ServerEnv): string | null {
  const jar = parseCookieHeader(cookieHeader);
  const v = jar[refreshCookieName(env)];
  return v && v.length >= 10 ? v : null;
}
