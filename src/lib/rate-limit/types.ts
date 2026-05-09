export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

/**
 * Pluggable rate limiter (in-memory today; swap for Redis / Durable Object in multi-instance).
 */
export type RateLimiter = (
  key: string,
  max: number,
  windowMs: number
) => RateLimitResult;
