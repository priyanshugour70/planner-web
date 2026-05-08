import { z } from "zod";

const idString = z.string().regex(/^\d+$/);

export const goalStatusSchema = z.enum(["active", "completed", "archived", "paused"]);
export const taskStatusSchema = z.enum(["todo", "in_progress", "done", "cancelled"]);
export const financeKindSchema = z.enum(["income", "expense"]);
export const habitFrequencySchema = z.enum(["daily", "weekly", "custom"]);

export const goalCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(20000).optional().nullable(),
  status: goalStatusSchema.optional(),
  priority: z.number().int().min(0).max(5).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
});

export const goalPatchSchema = goalCreateSchema.partial();

export const milestoneCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const milestonePatchSchema = milestoneCreateSchema.partial().extend({
  completedAt: z.string().datetime().optional().nullable(),
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(20000).optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: z.number().int().min(0).max(5).optional(),
  dueAt: z.union([z.string().datetime(), z.null()]).optional(),
  goalId: idString.optional().nullable(),
  parentTaskId: idString.optional().nullable(),
  tags: z.array(z.string().max(64)).max(32).optional(),
});

export const taskPatchSchema = taskCreateSchema.partial().extend({
  completedAt: z.union([z.string().datetime(), z.null()]).optional(),
});

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

export const habitCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  color: z.string().max(32).optional(),
  frequency: habitFrequencySchema.optional(),
  targetPerWeek: z.number().int().min(1).max(21).optional().nullable(),
});

export const habitPatchSchema = habitCreateSchema.partial();

export const habitEntryCreateSchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(1).max(99).optional(),
  note: z.string().max(500).optional().nullable(),
});

export const journalCreateSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().max(100000).optional(),
  mood: z.string().max(64).optional().nullable(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tags: z.array(z.string().max(64)).max(32).optional(),
});

export const journalPatchSchema = journalCreateSchema.partial();

export const noteCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  body: z.string().max(100000).optional(),
  pinned: z.boolean().optional(),
  color: z.string().max(32).optional().nullable(),
});

export const notePatchSchema = noteCreateSchema.partial();

export const calendarEventCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  allDay: z.boolean().optional(),
  color: z.string().max(32).optional(),
  taskId: idString.optional().nullable(),
  goalId: idString.optional().nullable(),
});

export const calendarEventPatchSchema = calendarEventCreateSchema.partial();

export function parseAmount(v: number | string): string {
  if (typeof v === "number") return v.toFixed(2);
  const n = Number(v);
  if (Number.isFinite(n)) return n.toFixed(2);
  return String(v);
}
