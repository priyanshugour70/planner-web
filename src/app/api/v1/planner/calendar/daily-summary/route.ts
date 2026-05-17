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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serialize);
  if (typeof obj === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = serialize(v);
    }
    return res;
  }
  return obj;
}

export const GET = withApiRoute(
  { module: "planner", action: "calendar_daily_summary" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const monthParam = req.nextUrl.searchParams.get("month");
    
    if (!monthParam) {
      throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Missing month parameter");
    }
    
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
      SELECT id, title, status, completed_at, due_at, created_at
      FROM tasks
      WHERE user_id = ${auth.userId}
        AND (
          (created_at::date >= ${start} AND created_at::date <= ${end}) OR
          (due_at::date >= ${start} AND due_at::date <= ${end}) OR
          (completed_at::date >= ${start} AND completed_at::date <= ${end})
        )
    `;

    // 2. Fetch Habit Entries
    const habits = await sql`
      SELECT he.id, he.entry_date, h.name, he.note, h.color
      FROM habit_entries he
      JOIN habits h ON he.habit_id = h.id
      WHERE h.user_id = ${auth.userId}
        AND he.entry_date >= ${start}::date
        AND he.entry_date <= ${end}::date
    `;

    // 3. Fetch Journal Entries
    const journals = await sql`
      SELECT id, title, mood, entry_date, created_at
      FROM journal_entries
      WHERE user_id = ${auth.userId}
        AND entry_date >= ${start}::date
        AND entry_date <= ${end}::date
    `;

    // 4. Fetch Notes
    const notes = await sql`
      SELECT id, title, created_at, updated_at
      FROM notes
      WHERE user_id = ${auth.userId}
        AND (
          (created_at::date >= ${start} AND created_at::date <= ${end}) OR
          (updated_at::date >= ${start} AND updated_at::date <= ${end})
        )
    `;

    // 5. Fetch Finance Transactions
    const transactions = await sql`
      SELECT id, amount, kind, category, note, occurred_on
      FROM transactions
      WHERE user_id = ${auth.userId}
        AND occurred_on >= ${start}::date
        AND occurred_on <= ${end}::date
    `;

    // 6. Fetch Calendar Events
    const events = await sql`
      SELECT id, title, starts_at, ends_at, color, description, location
      FROM calendar_events
      WHERE user_id = ${auth.userId}
        AND starts_at::date >= ${start}::date
        AND starts_at::date <= ${end}::date
    `;

    // Group by Date YYYY-MM-DD
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dailyData: Record<string, {
      tasks: any[];
      habits: any[];
      journals: any[];
      notes: any[];
      transactions: any[];
      events: any[];
    }> = {};

    // Helper to get or create day bucket
    const getBucket = (dateStr: string) => {
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { tasks: [], habits: [], journals: [], notes: [], transactions: [], events: [] };
      }
      return dailyData[dateStr];
    };

    // Distribute items to day buckets
    tasks.forEach((t) => {
      const dates = new Set<string>();
      dates.add(formatDate(t.created_at));
      if (t.due_at) dates.add(formatDate(t.due_at));
      if (t.completed_at) dates.add(formatDate(t.completed_at));
      
      dates.forEach((d) => {
        if (d >= start && d <= end) {
          getBucket(d).tasks.push(serialize(t));
        }
      });
    });

    habits.forEach((h) => {
      const d = formatDate(h.entry_date);
      getBucket(d).habits.push(serialize(h));
    });

    journals.forEach((j) => {
      const d = formatDate(j.entry_date);
      getBucket(d).journals.push(serialize(j));
    });

    notes.forEach((n) => {
      const dates = new Set<string>();
      dates.add(formatDate(n.created_at));
      dates.add(formatDate(n.updated_at));
      dates.forEach((d) => {
        if (d >= start && d <= end) {
          getBucket(d).notes.push(serialize(n));
        }
      });
    });

    transactions.forEach((tx) => {
      const d = formatDate(tx.occurred_on);
      getBucket(d).transactions.push(serialize(tx));
    });

    events.forEach((ev) => {
      const d = formatDate(ev.starts_at);
      getBucket(d).events.push(serialize(ev));
    });

    return jsonSuccess(requestId, dailyData);
  }
);
