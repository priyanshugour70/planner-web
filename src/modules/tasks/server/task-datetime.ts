import { z } from "zod";

/** ISO-8601 datetime or calendar date (YYYY-MM-DD). Date-only is stored as UTC midnight. */
export const taskDateTimeInputSchema = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  z.string().datetime({ offset: true }),
  z.string().datetime({ local: true }),
  z.null(),
]);

/**
 * Parse API due/completed timestamps for Postgres `timestamptz`.
 * - `null` → null
 * - `YYYY-MM-DD` → UTC start-of-day
 * - ISO datetime → `Date`
 */
export function parseTaskTimestamptz(value: string | null | undefined): Date | null {
  if (value === undefined || value === null) return null;
  if (value === "") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    return new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
  }
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
