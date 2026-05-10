/** Inclusive UTC calendar day `1..28|29|30|31` for `(year, monthIndex0)`. */
export function daysInUtcMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

/**
 * Add whole calendar months in UTC, clamping the day to the last day of the target month
 * (e.g. 2025-01-31 + 1 month → 2025-02-28).
 */
export function addCalendarMonthsUtc(isoDay: string, deltaMonths: number): string {
  const parts = isoDay.split("-").map((x) => Number(x));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return isoDay;
  const y0 = parts[0]!;
  const m0 = parts[1]! - 1;
  const d0 = parts[2]!;
  let y = y0;
  let m = m0 + deltaMonths;
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  while (m > 11) {
    m -= 12;
    y += 1;
  }
  const dim = daysInUtcMonth(y, m);
  const day = Math.min(d0, dim);
  return new Date(Date.UTC(y, m, day)).toISOString().slice(0, 10);
}

/**
 * UTC calendar month window for `reference`: `[first, firstOfNextMonth)` as `YYYY-MM-DD` strings.
 * Matches finance summary queries (`occurred_on >= start AND occurred_on < endExclusive`).
 */
export function getUtcCalendarMonthBounds(
  reference: Date = new Date()
): { startStr: string; endExclusiveStr: string } {
  const y = reference.getUTCFullYear();
  const m0 = reference.getUTCMonth();
  const startStr = new Date(Date.UTC(y, m0, 1)).toISOString().slice(0, 10);
  const endExclusiveStr = new Date(Date.UTC(y, m0 + 1, 1)).toISOString().slice(0, 10);
  return { startStr, endExclusiveStr };
}
