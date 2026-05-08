import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";

export const GET = withApiRoute(
  { module: "planner", action: "summary" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const [g] = await sql`SELECT COUNT(*)::int AS c FROM goals WHERE user_id = ${auth.userId}`;
    const [t] = await sql`SELECT COUNT(*)::int AS c FROM tasks WHERE user_id = ${auth.userId}`;
    const [td] = await sql`
      SELECT COUNT(*)::int AS c FROM tasks WHERE user_id = ${auth.userId} AND status = 'done'::task_status
    `;
    const [b] = await sql`SELECT COUNT(*)::int AS c FROM budgets WHERE user_id = ${auth.userId}`;
    const [tx] = await sql`SELECT COUNT(*)::int AS c FROM transactions WHERE user_id = ${auth.userId}`;
    const [h] = await sql`SELECT COUNT(*)::int AS c FROM habits WHERE user_id = ${auth.userId}`;
    const [j] = await sql`SELECT COUNT(*)::int AS c FROM journal_entries WHERE user_id = ${auth.userId}`;
    const [n] = await sql`SELECT COUNT(*)::int AS c FROM notes WHERE user_id = ${auth.userId}`;
    const [ev] = await sql`SELECT COUNT(*)::int AS c FROM calendar_events WHERE user_id = ${auth.userId}`;
    const [inc] = await sql`
      SELECT COALESCE(SUM(amount), 0)::text AS s FROM transactions
      WHERE user_id = ${auth.userId} AND kind = 'income'::finance_tx_kind
    `;
    const [exp] = await sql`
      SELECT COALESCE(SUM(amount), 0)::text AS s FROM transactions
      WHERE user_id = ${auth.userId} AND kind = 'expense'::finance_tx_kind
    `;

    return jsonSuccess(requestId, {
      goals: g?.c ?? 0,
      tasks: t?.c ?? 0,
      tasksDone: td?.c ?? 0,
      budgets: b?.c ?? 0,
      transactions: tx?.c ?? 0,
      habits: h?.c ?? 0,
      journalEntries: j?.c ?? 0,
      notes: n?.c ?? 0,
      calendarEvents: ev?.c ?? 0,
      totalIncome: inc?.s ?? "0",
      totalExpense: exp?.s ?? "0",
    });
  }
);
