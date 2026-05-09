import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { REQUEST_ID_HEADER } from "@/lib/http/request-id";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/goals",
  "/tasks",
  "/finance",
  "/habits",
  "/journal",
  "/notes",
  "/calendar",
] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function refreshCookieName(): string {
  return process.env.REFRESH_COOKIE_NAME?.trim() || "planner_refresh";
}

function hasRefreshCookie(req: NextRequest): boolean {
  const name = refreshCookieName();
  const raw = req.headers.get("cookie");
  if (!raw) return false;
  const prefix = `${name}=`;
  return raw.split(";").some((part) => part.trim().startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const id = request.headers.get(REQUEST_ID_HEADER) || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, id);

  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) && !hasRefreshCookie(request)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const res = NextResponse.redirect(login);
    res.headers.set(REQUEST_ID_HEADER, id);
    return res;
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set(REQUEST_ID_HEADER, id);
  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/goals",
    "/goals/:path*",
    "/tasks",
    "/tasks/:path*",
    "/finance",
    "/finance/:path*",
    "/habits",
    "/habits/:path*",
    "/journal",
    "/journal/:path*",
    "/notes",
    "/notes/:path*",
    "/calendar",
    "/calendar/:path*",
  ],
};
