import { z } from "zod";

const idString = z.string().regex(/^\d+$/);

export const financeKindSchema = z.enum(["income", "expense"]);

export const budgetCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().max(120).optional().nullable(),
  amountLimit: z.union([z.number().nonnegative(), z.string().regex(/^\d+(\.\d{1,2})?$/)]),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(5000).optional().nullable(),
});

export const budgetPatchSchema = budgetCreateSchema.partial();

export const transactionCreateSchema = z.object({
  kind: financeKindSchema,
  amount: z.union([z.number().nonnegative(), z.string().regex(/^\d+(\.\d{1,2})?$/)]),
  category: z.string().trim().max(120).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  budgetId: idString.optional().nullable(),
});

export const transactionPatchSchema = transactionCreateSchema.partial();

export function parseAmount(v: number | string): string {
  if (typeof v === "number") return v.toFixed(2);
  const n = Number(v);
  if (Number.isFinite(n)) return n.toFixed(2);
  return String(v);
}
