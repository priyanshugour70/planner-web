import { z } from "zod";

const idString = z.string().regex(/^\d+$/);

export const taskStatusSchema = z.enum(["todo", "in_progress", "done", "cancelled"]);

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
