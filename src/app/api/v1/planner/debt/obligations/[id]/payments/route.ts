import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { debtPaymentCreateSchema, parseAmount } from "@/modules/finance/server/schemas";
import { serializeDebtPayment, type DebtObligationRow, type DebtPaymentRow } from "@/modules/finance/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/debt\/obligations\/(\d+)\/payments\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "debt_payments_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const obligationId = bigIntPathId(req, re);
    const sql = getSql();
    const [o] = await sql`SELECT id FROM debt_obligations WHERE id = ${obligationId} AND user_id = ${auth.userId} LIMIT 1`;
    if (!o) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Obligation not found");
    const rows = await sql<DebtPaymentRow[]>`
      SELECT * FROM debt_payments WHERE obligation_id = ${obligationId} ORDER BY paid_at DESC, id DESC
    `;
    return jsonSuccess(requestId, rows.map(serializeDebtPayment));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "debt_payments_create", parseBody: debtPaymentCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const obligationId = bigIntPathId(req, re);
    const sql = getSql();
    const amt = parseAmount(body.amount);
    const note = body.note ?? null;

    const payment = await sql.begin(async (tx) => {
      const [o] = await tx<DebtObligationRow[]>`
        SELECT * FROM debt_obligations
        WHERE id = ${obligationId} AND user_id = ${auth.userId}
        LIMIT 1
        FOR UPDATE
      `;
      if (!o) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Obligation not found");

      const [u] = await tx<DebtObligationRow[]>`
        UPDATE debt_obligations
        SET
          balance = balance - ${amt}::numeric,
          status = CASE WHEN balance - ${amt}::numeric <= 0 THEN 'closed' ELSE status END,
          updated_at = NOW()
        WHERE id = ${obligationId} AND user_id = ${auth.userId} AND balance >= ${amt}::numeric
        RETURNING *
      `;
      if (!u) {
        throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Payment exceeds remaining balance");
      }

      const [p] = await tx<DebtPaymentRow[]>`
        INSERT INTO debt_payments (obligation_id, amount, note)
        VALUES (${obligationId}, ${amt}::numeric, ${note})
        RETURNING *
      `;
      if (!p) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Payment insert failed");
      return p;
    });

    return jsonSuccess(requestId, serializeDebtPayment(payment), { message: "Payment recorded" });
  }
);
