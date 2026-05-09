import type { NextRequest } from "next/server";
import { HttpError } from "@/modules/auth/server/http-error";
import { ErrorCodes } from "@/types/api-error";

export function bigIntPathId(req: NextRequest, pattern: RegExp): bigint {
  const m = req.nextUrl.pathname.match(pattern);
  if (!m?.[1] || !/^\d+$/.test(m[1])) {
    throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid resource id");
  }
  return BigInt(m[1]);
}
