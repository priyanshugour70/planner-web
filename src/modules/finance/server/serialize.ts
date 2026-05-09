import { iso, isoDate } from "@/modules/shared/server/serialize-helpers";

export interface BudgetRow {
  id: bigint;
  user_id: bigint;
  name: string;
  category: string | null;
  amount_limit: string;
  period_start: Date;
  period_end: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionRow {
  id: bigint;
  user_id: bigint;
  budget_id: bigint | null;
  kind: string;
  amount: string;
  category: string | null;
  note: string | null;
  occurred_on: Date;
  created_at: Date;
  merchant?: string | null;
  payment_method?: string | null;
  tags?: string[] | null;
  account_id?: bigint | null;
  category_id?: bigint | null;
}

export function serializeBudget(r: BudgetRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    name: r.name,
    category: r.category,
    amountLimit: r.amount_limit,
    periodStart: isoDate(r.period_start),
    periodEnd: isoDate(r.period_end),
    notes: r.notes,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

export function serializeTransaction(r: TransactionRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    budgetId: r.budget_id != null ? String(r.budget_id) : null,
    kind: r.kind,
    amount: r.amount,
    category: r.category,
    note: r.note,
    occurredOn: isoDate(r.occurred_on),
    createdAt: iso(r.created_at),
    merchant: r.merchant ?? null,
    paymentMethod: r.payment_method ?? null,
    tags: r.tags ?? [],
    accountId: r.account_id != null ? String(r.account_id) : null,
    categoryId: r.category_id != null ? String(r.category_id) : null,
  };
}
