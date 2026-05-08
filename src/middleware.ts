import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { REQUEST_ID_HEADER } from "@/lib/http/request-id";

export function middleware(request: NextRequest) {
  const id = request.headers.get(REQUEST_ID_HEADER) || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, id);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set(REQUEST_ID_HEADER, id);
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
