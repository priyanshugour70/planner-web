import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { parseAmount, transactionCreateSchema } from "@/server/planner/schemas";
import { serializeTransaction, type TransactionRow } from "@/server/planner/serialize";
import { ErrorCodes } from "@/types/api-error";
import { z } from "zod";

const listQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const GET = withApiRoute(
  { module: "planner", action: "transactions_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const q = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = listQuerySchema.safeParse(q);
    if (!parsed.success) {
      throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid query", {
        issues: parsed.error.issues,
      });
    }
    const sql = getSql();
    const from = parsed.data.from;
    const to = parsed.data.to;
    const rows =
      from && to
        ? await sql<TransactionRow[]>`
            SELECT * FROM transactions
            WHERE user_id = ${auth.userId}
              AND occurred_on >= ${from}::date AND occurred_on <= ${to}::date
            ORDER BY occurred_on DESC, id DESC
          `
        : await sql<TransactionRow[]>`
            SELECT * FROM transactions WHERE user_id = ${auth.userId}
            ORDER BY occurred_on DESC, id DESC
            LIMIT 200
          `;
    return jsonSuccess(requestId, rows.map(serializeTransaction));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "transactions_create", parseBody: transactionCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();

    let budgetId: bigint | null = null;
    if (body.budgetId) {
      budgetId = BigInt(body.budgetId);
      const [b] = await sql`SELECT id FROM budgets WHERE id = ${budgetId} AND user_id = ${auth.userId} LIMIT 1`;
      if (!b) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid budget");
    }

    const amt = parseAmount(body.amount);
    const occurredOn = body.occurredOn ?? new Date().toISOString().slice(0, 10);

    const [row] = await sql<TransactionRow[]>`
      INSERT INTO transactions (user_id, budget_id, kind, amount, category, note, occurred_on)
      VALUES (
        ${auth.userId},
        ${budgetId},
        ${body.kind}::finance_tx_kind,
        ${amt}::numeric,
        ${body.category ?? null},
        ${body.note ?? null},
        ${occurredOn}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeTransaction(row), { message: "Transaction recorded" });
  }
);
