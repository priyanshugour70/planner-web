import { z } from "zod";
import { idStringSchema } from "@/modules/shared/server/zod-ids";

export const habitFrequencySchema = z.enum(["daily", "weekly", "custom"]);

export const habitCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  color: z.string().max(32).optional(),
  icon: z.string().max(64).optional(),
  frequency: habitFrequencySchema.optional(),
  targetPerWeek: z.number().int().min(1).max(21).optional().nullable(),
  archived: z.boolean().optional(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  goalId: idStringSchema.optional().nullable(),
  customDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
});

export const habitPatchSchema = habitCreateSchema.partial();

export const habitEntryCreateSchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(1).max(99).optional(),
  note: z.string().max(500).optional().nullable(),
});

export const habitListQuerySchema = z.object({
  archived: z.enum(["true", "false"]).optional(),
  goalId: z.string().regex(/^\d+$/).optional(),
  frequency: habitFrequencySchema.optional(),
});

export const habitEntryListQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});
