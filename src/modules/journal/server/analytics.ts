import "server-only";
import { getSql } from "@/lib/db";
import { isoDate } from "@/modules/shared/server/serialize-helpers";
import type { JournalAnalyticsDTO } from "@/types/planner";

/**
 * Compute journal analytics: mood distribution, writing streak, word stats, entries per month.
 */
export async function computeJournalAnalytics(userId: bigint): Promise<JournalAnalyticsDTO> {
  const sql = getSql();

  // Totals
  const [totals] = await sql<{ entries: number; words: string; favs: number }[]>`
    SELECT
      COUNT(*)::int AS entries,
      COALESCE(SUM(word_count), 0)::text AS words,
      COUNT(*) FILTER (WHERE is_favorite = TRUE)::int AS favs
    FROM journal_entries WHERE user_id = ${userId}
  `;

  const totalEntries = totals?.entries ?? 0;
  const totalWords = Number(totals?.words ?? 0);
  const favoriteCount = totals?.favs ?? 0;
  const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

  // Mood distribution
  const moods = await sql<{ mood: string; c: number }[]>`
    SELECT mood, COUNT(*)::int AS c
    FROM journal_entries
    WHERE user_id = ${userId} AND mood IS NOT NULL AND mood != ''
    GROUP BY mood
    ORDER BY c DESC
  `;
  const moodDistribution = moods.map((r) => ({ mood: r.mood, count: r.c }));

  // Entries per month (last 12 months)
  const monthly = await sql<{ month: string; c: number }[]>`
    SELECT TO_CHAR(entry_date, 'YYYY-MM') AS month, COUNT(*)::int AS c
    FROM journal_entries
    WHERE user_id = ${userId}
      AND entry_date >= (CURRENT_DATE - INTERVAL '12 months')
    GROUP BY TO_CHAR(entry_date, 'YYYY-MM')
    ORDER BY month ASC
  `;
  const entriesPerMonth = monthly.map((r) => ({ month: r.month, count: r.c }));

  // Writing streak
  const allDates = await sql<{ entry_date: Date }[]>`
    SELECT DISTINCT entry_date
    FROM journal_entries
    WHERE user_id = ${userId}
    ORDER BY entry_date DESC
  `;

  const { currentStreak, longestStreak } = computeWritingStreaks(
    allDates.map((r) => r.entry_date)
  );

  return {
    totalEntries,
    totalWords,
    avgWordsPerEntry,
    favoriteCount,
    moodDistribution,
    entriesPerMonth,
    currentWritingStreak: currentStreak,
    longestWritingStreak: longestStreak,
  };
}

function computeWritingStreaks(dates: Date[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dayStrings = [...new Set(dates.map((d) => d.toISOString().slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let currentStreak = 0;
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

  const chrono = [...dayStrings].reverse();
  let streak = 1;
  let longestStreak = 1;
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

/** Curated journal prompts for daily inspiration. */
export const JOURNAL_PROMPTS: readonly string[] = [
  "What are three things you're grateful for today?",
  "What was the most meaningful moment of your day?",
  "If you could change one thing about today, what would it be?",
  "What did you learn today that surprised you?",
  "Describe a challenge you faced and how you handled it.",
  "What made you smile today?",
  "Write about someone who positively influenced your day.",
  "What's one goal you made progress on today?",
  "How did you practice self-care today?",
  "What would you tell your future self about today?",
  "What's something you're looking forward to tomorrow?",
  "Describe your energy levels throughout the day.",
  "What boundaries did you set or maintain today?",
  "Write about a moment of peace or calm you experienced.",
  "What habit are you most proud of maintaining?",
  "If today were a chapter in your life story, what would the title be?",
  "What emotions dominated your day and why?",
  "Write about something you want to let go of.",
  "What's a small win you can celebrate from today?",
  "How do you want tomorrow to be different from today?",
  "What advice would you give to someone going through what you went through today?",
  "Describe the weather and how it affected your mood.",
  "What's one thing you did purely for enjoyment today?",
  "Write about a conversation that stuck with you.",
  "What are you most curious about right now?",
  "How did you show kindness today — to yourself or others?",
  "What's one thing you want to remember about this week?",
  "Write about a fear you're working to overcome.",
  "What's the most important decision you made today?",
  "If you had an extra hour today, how would you have spent it?",
] as const;

/** Get a prompt for a given date (deterministic rotation). */
export function getPromptForDate(date: string = new Date().toISOString().slice(0, 10)): string {
  const parts = date.split("-").map(Number);
  const dayOfYear = Math.floor(
    (new Date(parts[0]!, (parts[1] ?? 1) - 1, parts[2] ?? 1).getTime() -
      new Date(parts[0]!, 0, 0).getTime()) /
      86400000
  );
  return JOURNAL_PROMPTS[dayOfYear % JOURNAL_PROMPTS.length]!;
}
