import { z } from "zod";

export const goalStatusSchema = z.enum(["active", "completed", "archived", "paused"]);

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
