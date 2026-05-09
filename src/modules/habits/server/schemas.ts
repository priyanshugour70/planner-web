import { z } from "zod";

export const habitFrequencySchema = z.enum(["daily", "weekly", "custom"]);

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
