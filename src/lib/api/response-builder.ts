import type { APIEnvelope, APIErrorEnvelope, APISuccessEnvelope } from "@/types/api-response";

export function successEnvelope<T>(
  requestId: string,
  data: T,
  message = "",
  meta: Record<string, unknown> = {}
): APISuccessEnvelope<T> {
  return {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function errorEnvelope(
  requestId: string,
  message: string,
  code: string,
  details?: Record<string, unknown>,
  stack?: string
): APIErrorEnvelope {
  return {
    success: false,
    message,
    error: {
      code,
      details,
      stack,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function jsonSuccess<T>(
  requestId: string,
  data: T,
  init?: ResponseInit & { message?: string; meta?: Record<string, unknown> }
): Response {
  const body: APIEnvelope<T> = successEnvelope(
    requestId,
    data,
    init?.message ?? "",
    init?.meta ?? {}
  );
  return Response.json(body, { status: init?.status ?? 200, headers: init?.headers });
}

/** Append `Set-Cookie` headers without cloning JSON body twice. */
export function withSetCookies(res: Response, cookies: string[]): Response {
  const headers = new Headers(res.headers);
  for (const c of cookies) {
    headers.append("Set-Cookie", c);
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export function jsonError(
  requestId: string,
  status: number,
  message: string,
  code: string,
  details?: Record<string, unknown>,
  stack?: string
): Response {
  const body: APIEnvelope<never> = errorEnvelope(requestId, message, code, details, stack);
  return Response.json(body, { status });
}
