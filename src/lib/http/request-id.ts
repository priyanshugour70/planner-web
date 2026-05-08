import type { NextRequest } from "next/server";

export const REQUEST_ID_HEADER = "x-request-id";

export function readRequestId(req: NextRequest): string {
  return req.headers.get(REQUEST_ID_HEADER)?.trim() || crypto.randomUUID();
}
