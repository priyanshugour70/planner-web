import { z } from "zod";
import { idStringSchema } from "@/modules/shared/server/zod-ids";

export const financeKindSchema = z.enum(["income", "expense"]);

const amountInput = z.union([z.number().nonnegative(), z.string().regex(/^\d+(\.\d{1,2})?$/)]);

export const budgetCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().max(120).optional().nullable(),
  amountLimit: amountInput,
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(5000).optional().nullable(),
});

export const budgetPatchSchema = budgetCreateSchema.partial();

const tagsSchema = z.array(z.string().trim().max(48)).max(40).optional();

export const transactionCreateSchema = z.object({
  kind: financeKindSchema,
  amount: amountInput,
  category: z.string().trim().max(120).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  budgetId: idStringSchema.optional().nullable(),
  accountId: idStringSchema.optional().nullable(),
  categoryId: idStringSchema.optional().nullable(),
  merchant: z.string().trim().max(200).optional().nullable(),
  paymentMethod: z.string().trim().max(64).optional().nullable(),
  tags: tagsSchema,
});

export const transactionPatchSchema = transactionCreateSchema.partial();

export const financeAccountCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.string().trim().min(1).max(32).default("cash"),
  currency: z.string().trim().length(3).default("INR"),
});

export const financeAccountPatchSchema = financeAccountCreateSchema.partial();

export const financeCategoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.string().trim().min(1).max(16).default("expense"),
  parentId: idStringSchema.optional().nullable(),
});

export const financeCategoryPatchSchema = financeCategoryCreateSchema.partial();

export const debtObligationCreateSchema = z.object({
  counterparty: z.string().trim().min(1).max(200),
  direction: z.string().trim().min(1).max(16),
  principal: amountInput,
  balance: amountInput.optional(),
  currency: z.string().trim().length(3).default("INR"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.string().trim().max(24).default("open"),
  notes: z.string().max(5000).optional().nullable(),
});

export const debtObligationPatchSchema = debtObligationCreateSchema.partial();

export const debtPaymentCreateSchema = z.object({
  amount: amountInput,
  note: z.string().max(2000).optional().nullable(),
});

export function parseAmount(v: number | string): string {
  if (typeof v === "number") return v.toFixed(2);
  const n = Number(v);
  if (Number.isFinite(n)) return n.toFixed(2);
  return String(v);
}
