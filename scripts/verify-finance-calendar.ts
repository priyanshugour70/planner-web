/**
 * Lightweight checks for UTC month boundaries + EMI month stepping.
 * Run: pnpm run test:finance
 */
import assert from "node:assert/strict";
import { addCalendarMonthsUtc, getUtcCalendarMonthBounds } from "../src/modules/finance/server/calendar-month";

const { startStr, endExclusiveStr } = getUtcCalendarMonthBounds(new Date(Date.UTC(2025, 5, 15)));
assert.match(startStr, /^\d{4}-\d{2}-01$/);
assert.ok(endExclusiveStr > startStr);

assert.equal(addCalendarMonthsUtc("2025-01-15", 1), "2025-02-15");
assert.equal(addCalendarMonthsUtc("2025-01-31", 1), "2025-02-28");
assert.equal(addCalendarMonthsUtc("2024-01-31", 1), "2024-02-29");
assert.equal(addCalendarMonthsUtc("2025-12-05", 1), "2026-01-05");
assert.equal(addCalendarMonthsUtc("2025-03-01", -1), "2025-02-01");

console.log("verify-finance-calendar: ok");
