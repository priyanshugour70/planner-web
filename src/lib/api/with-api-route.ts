import type { NextRequest } from "next/server";
import type { ZodType } from "zod";
import postgres from "postgres";
import { jsonError, jsonSuccess } from "@/lib/api/response-builder";
import { insertAuditLog, type AuditTypeValue } from "@/lib/audit/write-audit";
import { maskSensitiveObject } from "@/lib/audit/mask";
import { getClientIp } from "@/lib/http/client-ip";
import { corsHeaders, mergeCors } from "@/lib/http/cors";
import { readRequestId } from "@/lib/http/request-id";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { getServerEnv } from "@/lib/config/server-env";
import { ErrorCodes } from "@/types/api-error";
import { HttpError } from "@/modules/auth/server/http-error";
import { parseUa } from "@/modules/auth/server/ua";
import { isMissingSchemaObject } from "@/lib/db/postgres-errors";

export type ApiContext<TBody = unknown> = {
  req: NextRequest;
  requestId: string;
  startedAt: number;
  body: TBody;
  ip: string | undefined;
  ua: string | null;
};

export type ApiRouteHandler<TBody = unknown> = (
  ctx: ApiContext<TBody>
) => Promise<Response>;

export type WithApiRouteConfig<TBody = unknown> = {
  module: string;
  action: string;
  auditType?: AuditTypeValue;
  rateLimit?: { max: number; windowMs?: number };
  parseBody?: ZodType<TBody>;
};

function stackFor(err: unknown): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  if (err instanceof Error) return err.stack;
  return undefined;
}

export function withApiRoute<TBody = unknown>(
  cfg: WithApiRouteConfig<TBody>,
  handler: ApiRouteHandler<TBody>
): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }

    const requestId = readRequestId(req);
    const startedAt = Date.now();
    const ip = getClientIp(req);
    const ua = req.headers.get("user-agent");
    const uaParts = parseUa(ua);

    let body: TBody = undefined as TBody;

    if (cfg.parseBody && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const raw = await req.text();
      let json: unknown = {};
      if (raw) {
        try {
          json = JSON.parse(raw) as unknown;
        } catch {
          const res = jsonError(
            requestId,
            400,
            "Invalid JSON body",
            ErrorCodes.INVALID_INPUT
          );
          return mergeCors(req, res);
        }
      }
      const parsed = cfg.parseBody.safeParse(json);
      if (!parsed.success) {
        const res = jsonError(requestId, 400, "Validation failed", ErrorCodes.VALIDATION_ERROR, {
          issues: parsed.error.issues,
        });
        return mergeCors(req, res);
      }
      body = parsed.data;
    }

    const audit = async (input: {
      response: Response;
      errorStack?: string | null;
      userId?: bigint | null;
      sessionId?: string | null;
    }) => {
      const duration = Date.now() - startedAt;
      let responseBody: unknown = null;
      try {
        const ct = input.response.headers.get("content-type");
        if (ct?.includes("application/json")) {
          responseBody = await input.response.clone().json();
        }
      } catch {
        responseBody = null;
      }

      try {
        await insertAuditLog({
          requestId,
          userId: input.userId ?? null,
          sessionId: input.sessionId ?? null,
          action: cfg.action,
          module: cfg.module,
          endpoint: req.nextUrl.pathname,
          method: req.method,
          ipAddress: ip ?? null,
          userAgent: ua,
          deviceType: uaParts.deviceType,
          platform: uaParts.platform,
          browser: uaParts.browser,
          os: uaParts.os,
          requestHeaders: Object.fromEntries(req.headers.entries()),
          requestBody: maskSensitiveObject(body ?? {}),
          responseBody,
          responseStatus: input.response.status,
          errorStack: input.errorStack ?? null,
          executionTimeMs: duration,
          severity:
            input.response.status >= 500
              ? "error"
              : input.response.status >= 400
                ? "warning"
                : "info",
          auditType: cfg.auditType ?? "api",
        });
      } catch (e) {
        console.error("audit_log_failed", e);
      }
    };

    try {
      let env: ReturnType<typeof getServerEnv>;
      try {
        env = getServerEnv();
      } catch (e) {
        const res = jsonError(
          requestId,
          500,
          "Server is misconfigured",
          ErrorCodes.INTERNAL_ERROR,
          { hint: e instanceof Error ? e.message : String(e) }
        );
        await audit({ response: res, errorStack: stackFor(e) });
        return mergeCors(req, res);
      }

      if (cfg.rateLimit) {
        const key = `${ip ?? "unknown"}:${cfg.module}:${cfg.action}`;
        const lim = checkRateLimit(
          key,
          cfg.rateLimit.max,
          cfg.rateLimit.windowMs ?? env.RATE_LIMIT_WINDOW_MS
        );
        if (!lim.ok) {
          const res = jsonError(
            requestId,
            429,
            "Too many requests",
            ErrorCodes.RATE_LIMIT_EXCEEDED,
            { retryAfterMs: lim.retryAfterMs }
          );
          await audit({ response: res });
          return mergeCors(req, res);
        }
      }

      const res = await handler({
        req,
        requestId,
        startedAt,
        body,
        ip,
        ua,
      });

      res.headers.set("x-request-id", requestId);
      await audit({ response: res });
      return mergeCors(req, res);
    } catch (err) {
      console.error(`[API Route Exception] [${req.method}] ${req.nextUrl.pathname}:`, err);
      
      if (err instanceof HttpError) {
        const res = jsonError(
          requestId,
          err.status,
          err.message,
          err.code,
          err.details,
          stackFor(err)
        );
        await audit({ response: res, errorStack: stackFor(err) });
        return mergeCors(req, res);
      }

      if (err instanceof postgres.PostgresError && isMissingSchemaObject(err)) {
        const res = jsonError(
          requestId,
          503,
          "Database schema is incomplete. Apply migrations: pnpm db:repair (partial installs) or pnpm db:migrate --continue",
          ErrorCodes.SERVICE_UNAVAILABLE,
          { postgresCode: err.code, detail: err.message }
        );
        await audit({ response: res, errorStack: stackFor(err) });
        return mergeCors(req, res);
      }

      const res = jsonError(
        requestId,
        500,
        "Internal server error",
        ErrorCodes.INTERNAL_ERROR,
        undefined,
        stackFor(err)
      );
      await audit({ response: res, errorStack: stackFor(err) });
      return mergeCors(req, res);
    }
  };
}

export { jsonSuccess };
