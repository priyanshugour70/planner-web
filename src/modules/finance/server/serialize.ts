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

export interface FinanceAccountRow {
  id: bigint;
  user_id: bigint;
  name: string;
  kind: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface FinanceCategoryRow {
  id: bigint;
  user_id: bigint;
  name: string;
  kind: string;
  parent_id: bigint | null;
  created_at: Date;
}

export interface DebtObligationRow {
  id: bigint;
  user_id: bigint;
  counterparty: string;
  direction: string;
  principal: string;
  balance: string;
  currency: string;
  due_date: Date | null;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DebtPaymentRow {
  id: bigint;
  obligation_id: bigint;
  amount: string;
  paid_at: Date;
  note: string | null;
}

export interface RecurringRuleRow {
  id: bigint;
  user_id: bigint;
  template_kind: string;
  template_amount: string;
  template_category: string | null;
  cadence: string;
  next_run_on: Date;
  active: boolean;
  created_at: Date;
  label: string;
  account_id: bigint | null;
  budget_id: bigint | null;
  category_id: bigint | null;
}

export function serializeFinanceAccount(r: FinanceAccountRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    name: r.name,
    kind: r.kind,
    currency: r.currency,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

export function serializeFinanceCategory(r: FinanceCategoryRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    name: r.name,
    kind: r.kind,
    parentId: r.parent_id != null ? String(r.parent_id) : null,
    createdAt: iso(r.created_at),
  };
}

export function serializeDebtObligation(r: DebtObligationRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    counterparty: r.counterparty,
    direction: r.direction,
    principal: r.principal,
    balance: r.balance,
    currency: r.currency,
    dueDate: r.due_date ? isoDate(r.due_date) : null,
    status: r.status,
    notes: r.notes,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

export function serializeDebtPayment(r: DebtPaymentRow) {
  return {
    id: String(r.id),
    obligationId: String(r.obligation_id),
    amount: r.amount,
    paidAt: iso(r.paid_at),
    note: r.note,
  };
}

export function serializeRecurringRule(r: RecurringRuleRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    label: r.label,
    templateKind: r.template_kind,
    templateAmount: r.template_amount,
    templateCategory: r.template_category,
    cadence: r.cadence,
    nextRunOn: isoDate(r.next_run_on) as string,
    active: r.active,
    accountId: r.account_id != null ? String(r.account_id) : null,
    budgetId: r.budget_id != null ? String(r.budget_id) : null,
    categoryId: r.category_id != null ? String(r.category_id) : null,
    createdAt: iso(r.created_at),
  };
}
