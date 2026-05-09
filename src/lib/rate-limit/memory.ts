import type { RateLimitResult } from "@/lib/rate-limit/types";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= max) {
    return { ok: false, retryAfterMs: Math.max(0, bucket.resetAt - now) };
  }
  bucket.count += 1;
  return { ok: true };
}
