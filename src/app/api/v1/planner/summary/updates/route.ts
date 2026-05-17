import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { ErrorCodes } from "@/types/api-error";
import { z } from "zod";

const summaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
});

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export const GET = withApiRoute(
  { module: "planner", action: "summary_updates" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const monthParam = req.nextUrl.searchParams.get("month") || new Date().toISOString().slice(0, 7);
    
    const parsed = summaryQuerySchema.safeParse({ month: monthParam });
    if (!parsed.success) {
      throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid month format (expected YYYY-MM)");
    }
    
    const { month } = parsed.data;
    const start = `${month}-01`;
    const year = parseInt(month.split("-")[0]);
    const m = parseInt(month.split("-")[1]);
    const end = new Date(year, m, 0).toISOString().slice(0, 10);

    const sql = getSql();

    // 1. Fetch Tasks
    const tasks = await sql`
      SELECT id, created_at, updated_at, completed_at
      FROM tasks
      WHERE user_id = ${auth.userId}
        AND (
          (created_at::date >= ${start} AND created_at::date <= ${end}) OR
          (completed_at::date >= ${start} AND completed_at::date <= ${end})
        )
    `;

    // 2. Fetch Habit Entries
    const habits = await sql`
      SELECT he.id, he.entry_date
      FROM habit_entries he
      JOIN habits h ON he.habit_id = h.id
      WHERE h.user_id = ${auth.userId}
        AND he.entry_date >= ${start}::date
        AND he.entry_date <= ${end}::date
    `;

    // 3. Fetch Journal Entries
    const journals = await sql`
      SELECT id, entry_date
      FROM journal_entries
      WHERE user_id = ${auth.userId}
        AND entry_date >= ${start}::date
        AND entry_date <= ${end}::date
    `;

    // 4. Fetch Notes
    const notes = await sql`
      SELECT id, created_at, updated_at
      FROM notes
      WHERE user_id = ${auth.userId}
        AND (
          (created_at::date >= ${start} AND created_at::date <= ${end}) OR
          (updated_at::date >= ${start} AND updated_at::date <= ${end})
        )
    `;

    // 5. Fetch Transactions
    const transactions = await sql`
      SELECT id, occurred_on
      FROM transactions
      WHERE user_id = ${auth.userId}
        AND occurred_on >= ${start}::date
        AND occurred_on <= ${end}::date
    `;

    // 6. Fetch Calendar Events
    const events = await sql`
      SELECT id, starts_at
      FROM calendar_events
      WHERE user_id = ${auth.userId}
        AND starts_at::date >= ${start}::date
        AND starts_at::date <= ${end}::date
    `;

    // Aggregated counts by date
    const dailyCounts: Record<string, {
      tasks: number;
      habits: number;
      journals: number;
      notes: number;
      transactions: number;
      events: number;
      total: number;
    }> = {};

    const getBucket = (dateStr: string) => {
      if (!dailyCounts[dateStr]) {
        dailyCounts[dateStr] = { tasks: 0, habits: 0, journals: 0, notes: 0, transactions: 0, events: 0, total: 0 };
      }
      return dailyCounts[dateStr];
    };

    tasks.forEach((t) => {
      const dates = new Set<string>();
      dates.add(formatDate(t.created_at));
      if (t.completed_at) dates.add(formatDate(t.completed_at));
      dates.forEach((d) => {
        if (d >= start && d <= end) {
          const b = getBucket(d);
          b.tasks++;
          b.total++;
        }
      });
    });

    habits.forEach((h) => {
      const d = formatDate(h.entry_date);
      const b = getBucket(d);
      b.habits++;
      b.total++;
    });

    journals.forEach((j) => {
      const d = formatDate(j.entry_date);
      const b = getBucket(d);
      b.journals++;
      b.total++;
    });

    notes.forEach((n) => {
      const dates = new Set<string>();
      dates.add(formatDate(n.created_at));
      dates.add(formatDate(n.updated_at));
      dates.forEach((d) => {
        if (d >= start && d <= end) {
          const b = getBucket(d);
          b.notes++;
          b.total++;
        }
      });
    });

    transactions.forEach((tx) => {
      const d = formatDate(tx.occurred_on);
      const b = getBucket(d);
      b.transactions++;
      b.total++;
    });

    events.forEach((ev) => {
      const d = formatDate(ev.starts_at);
      const b = getBucket(d);
      b.events++;
      b.total++;
    });

    return jsonSuccess(requestId, dailyCounts);
  }
);
