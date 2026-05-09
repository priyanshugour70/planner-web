export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };
