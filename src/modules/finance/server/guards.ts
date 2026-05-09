import type { SqlClient } from "@/lib/db";
import { HttpError } from "@/modules/auth/server/http-error";
import { ErrorCodes } from "@/types/api-error";

export async function requireFinanceAccount(
  sql: SqlClient,
  userId: bigint,
  accountId: bigint
): Promise<void> {
  const [row] = await sql`SELECT id FROM finance_accounts WHERE id = ${accountId} AND user_id = ${userId} LIMIT 1`;
  if (!row) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid account");
}

export async function requireFinanceCategory(
  sql: SqlClient,
  userId: bigint,
  categoryId: bigint
): Promise<void> {
  const [row] = await sql`SELECT id FROM finance_categories WHERE id = ${categoryId} AND user_id = ${userId} LIMIT 1`;
  if (!row) throw new HttpError(400, ErrorCodes.VALIDATION_ERROR, "Invalid category");
}
