import "server-only";
import postgres from "postgres";
import { getSql } from "@/lib/db";
import { maskSensitiveObject, truncateJson } from "@/lib/audit/mask";

export type AuditTypeValue =
  | "auth"
  | "security"
  | "compliance"
  | "api"
  | "admin"
  | "system";

export type AuditSeverityValue =
  | "debug"
  | "info"
  | "warning"
  | "error"
  | "critical";

export interface AuditInsert {
  requestId: string;
  traceId?: string;
  userId?: bigint | null;
  sessionId?: string | null;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  endpoint: string;
  method: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceType?: string | null;
  platform?: string | null;
  browser?: string | null;
  os?: string | null;
  requestHeaders?: unknown;
  requestBody?: unknown;
  responseBody?: unknown;
  responseStatus?: number | null;
  errorStack?: string | null;
  executionTimeMs?: number | null;
  geoLocation?: unknown;
  country?: string | null;
  city?: string | null;
  riskScore?: number | null;
  severity: AuditSeverityValue;
  auditType: AuditTypeValue;
}

function asJson(value: unknown): Record<string, unknown> {
  const masked = maskSensitiveObject(value ?? {});
  return truncateJson(masked) as Record<string, unknown>;
}

export async function insertAuditLog(row: AuditInsert): Promise<void> {
  const sql = getSql();
  const requestHeaders = sql.json(asJson(row.requestHeaders ?? {}) as never);
  const requestBody = sql.json(asJson(row.requestBody ?? {}) as never);
  const responseBody = sql.json(asJson(row.responseBody ?? {}) as never);
  const geoLocation =
    row.geoLocation != null ? sql.json(asJson(row.geoLocation) as never) : null;

  try {
    await sql`
    INSERT INTO audit_logs (
      request_id, trace_id, user_id, session_id, action, module,
      entity_type, entity_id, endpoint, method, ip_address, user_agent,
      device_type, platform, browser, os, request_headers, request_body,
      response_body, response_status, error_stack, execution_time_ms,
      geo_location, country, city, risk_score, severity, audit_type
    ) VALUES (
      ${row.requestId},
      ${row.traceId ?? null},
      ${row.userId != null ? String(row.userId) : null},
      ${row.sessionId ?? null},
      ${row.action},
      ${row.module},
      ${row.entityType ?? null},
      ${row.entityId ?? null},
      ${row.endpoint},
      ${row.method},
      ${row.ipAddress ?? null},
      ${row.userAgent ?? null},
      ${row.deviceType ?? null},
      ${row.platform ?? null},
      ${row.browser ?? null},
      ${row.os ?? null},
      ${requestHeaders},
      ${requestBody},
      ${responseBody},
      ${row.responseStatus ?? null},
      ${row.errorStack ?? null},
      ${row.executionTimeMs ?? null},
      ${geoLocation},
      ${row.country ?? null},
      ${row.city ?? null},
      ${row.riskScore ?? null},
      ${row.severity},
      ${row.auditType}
    )
  `;
  } catch (err) {
    if (err instanceof postgres.PostgresError && err.code === "42P01") {
      console.warn(
        "[audit] Table audit_logs is missing. Run: pnpm db:repair (or pnpm db:migrate --continue)"
      );
      return;
    }
    throw err;
  }
}
