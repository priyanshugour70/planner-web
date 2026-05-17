import "server-only";
import { getSql } from "@/lib/db";
import { isoDate } from "@/modules/shared/server/serialize-helpers";
import type { HabitAnalyticsDTO, HabitsSummaryDTO } from "@/types/planner";

/**
 * Compute streak, completion rate, and last-30-days for a single habit.
 */
export async function computeHabitAnalytics(
  userId: bigint,
  habitId: bigint
): Promise<HabitAnalyticsDTO> {
  const sql = getSql();

  // Verify ownership
  const [habit] = await sql`SELECT id FROM habits WHERE id = ${habitId} AND user_id = ${userId} LIMIT 1`;
  if (!habit) {
    return {
      habitId: String(habitId),
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      totalCount: 0,
      completionRate: 0,
      last30Days: [],
    };
  }

  // Total entries and count
  const [totals] = await sql<{ entries: number; total_count: string }[]>`
    SELECT COUNT(*)::int AS entries, COALESCE(SUM(count), 0)::text AS total_count
    FROM habit_entries WHERE habit_id = ${habitId}
  `;

  // Last 30 days of entries
  const today = new Date();
  const thirtyAgo = new Date(today);
  thirtyAgo.setUTCDate(thirtyAgo.getUTCDate() - 29);
  const fromStr = thirtyAgo.toISOString().slice(0, 10);
  const toStr = today.toISOString().slice(0, 10);

  const recentRows = await sql<{ entry_date: Date; count: number }[]>`
    SELECT entry_date, count
    FROM habit_entries
    WHERE habit_id = ${habitId}
      AND entry_date >= ${fromStr}::date
      AND entry_date <= ${toStr}::date
    ORDER BY entry_date ASC
  `;

  const last30Days = recentRows.map((r) => ({
    date: isoDate(r.entry_date) ?? "",
    count: r.count,
  }));

  // Completion rate: entries out of last 30 days
  const completionRate = Math.round((last30Days.length / 30) * 100);

  // Streak computation using ordered entry dates
  const allDates = await sql<{ entry_date: Date }[]>`
    SELECT DISTINCT entry_date
    FROM habit_entries
    WHERE habit_id = ${habitId}
    ORDER BY entry_date DESC
  `;

  const { currentStreak, longestStreak } = computeStreaks(allDates.map((r) => r.entry_date));

  return {
    habitId: String(habitId),
    currentStreak,
    longestStreak,
    totalEntries: totals?.entries ?? 0,
    totalCount: Number(totals?.total_count ?? 0),
    completionRate,
    last30Days,
  };
}

/**
 * Compute current and longest streaks from an array of Date objects (DESC order).
 */
function computeStreaks(dates: Date[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Normalize to YYYY-MM-DD strings and dedupe
  const dayStrings = [...new Set(dates.map((d) => d.toISOString().slice(0, 10)))].sort().reverse();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 1;

  // Current streak: must include today or yesterday
  if (dayStrings[0] === today || dayStrings[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < dayStrings.length; i++) {
      const prev = new Date(dayStrings[i - 1]!);
      const curr = new Date(dayStrings[i]!);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (Math.round(diff) === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak (iterate in chronological order)
  const chrono = [...dayStrings].reverse();
  streak = 1;
  longestStreak = 1;
  for (let i = 1; i < chrono.length; i++) {
    const prev = new Date(chrono[i - 1]!);
    const curr = new Date(chrono[i]!);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * Summary stats for the habits overview.
 */
export async function computeHabitsSummary(userId: bigint): Promise<HabitsSummaryDTO> {
  const sql = getSql();
  const today = new Date().toISOString().slice(0, 10);

  const [counts] = await sql<{ total: number; active: number; archived: number }[]>`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE archived = FALSE)::int AS active,
      COUNT(*) FILTER (WHERE archived = TRUE)::int AS archived
    FROM habits WHERE user_id = ${userId}
  `;

  const [logged] = await sql<{ c: number }[]>`
    SELECT COUNT(DISTINCT he.habit_id)::int AS c
    FROM habit_entries he
    INNER JOIN habits h ON h.id = he.habit_id AND h.user_id = ${userId}
    WHERE he.entry_date = ${today}::date
  `;

  // Get active habits and compute streaks
  const activeHabits = await sql<{ id: bigint }[]>`
    SELECT id FROM habits WHERE user_id = ${userId} AND archived = FALSE
  `;

  let totalStreaksActive = 0;
  let bestCurrentStreak = 0;

  for (const h of activeHabits) {
    const analytics = await computeHabitAnalytics(userId, h.id);
    if (analytics.currentStreak > 0) totalStreaksActive++;
    bestCurrentStreak = Math.max(bestCurrentStreak, analytics.currentStreak);
  }

  return {
    totalHabits: counts?.total ?? 0,
    activeHabits: counts?.active ?? 0,
    archivedHabits: counts?.archived ?? 0,
    todayLogged: logged?.c ?? 0,
    totalStreaksActive,
    bestCurrentStreak,
  };
}
