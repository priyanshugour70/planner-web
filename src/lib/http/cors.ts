import type { NextRequest } from "next/server";

function parseOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return ["*"];
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

export function corsHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  const origin = req.headers.get("origin");
  const allowed = parseOrigins();

  if (allowed.includes("*")) {
    headers.set("Access-Control-Allow-Origin", origin ?? "*");
  } else if (origin && allowed.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  } else if (origin) {
    headers.set("Access-Control-Allow-Origin", allowed[0] ?? "null");
  }

  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Request-Id, X-CSRF-Token"
  );
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export function mergeCors(req: NextRequest, res: Response): Response {
  const h = corsHeaders(req);
  const merged = new Response(res.body, res);
  h.forEach((v, k) => merged.headers.set(k, v));
  return merged;
}
