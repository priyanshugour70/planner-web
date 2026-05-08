import type { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api/response-builder";
import { getSql } from "@/lib/db";
import { readRequestId } from "@/lib/http/request-id";
import { ErrorCodes } from "@/types/api-error";

export async function GET(req: NextRequest) {
  const requestId = readRequestId(req);
  try {
    const sql = getSql();
    const rows = await sql<{ version: string }[]>`
      SELECT version() AS version
    `;
    const version = rows[0]?.version ?? "unknown";
    return jsonSuccess(
      requestId,
      { ok: true as const, version },
      { message: "Database connection OK" }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const missingConfig =
      message.includes("Set DATABASE_URL") || message.includes("PGHOST");

    return jsonError(
      requestId,
      missingConfig ? 400 : 503,
      missingConfig ? "Database environment variables are not set" : "Database unreachable",
      missingConfig ? ErrorCodes.VALIDATION_ERROR : ErrorCodes.SERVICE_UNAVAILABLE,
      { message }
    );
  }
}
