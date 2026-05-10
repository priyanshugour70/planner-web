import type { NextRequest } from "next/server";

/** Sent by native apps; used to include refresh tokens in JSON (httpOnly cookies are not usable). */
export const PLANNER_CLIENT_HEADER = "x-planner-client";
export const PLANNER_CLIENT_NATIVE = "native";

export function isPlannerNativeClient(req: NextRequest): boolean {
  const v = req.headers.get(PLANNER_CLIENT_HEADER)?.trim().toLowerCase();
  return v === PLANNER_CLIENT_NATIVE;
}
