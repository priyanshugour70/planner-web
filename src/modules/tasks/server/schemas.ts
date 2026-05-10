import { z } from "zod";
import { idStringSchema } from "@/modules/shared/server/zod-ids";
import { taskDateTimeInputSchema } from "@/modules/tasks/server/task-datetime";

export const taskStatusSchema = z.enum(["todo", "in_progress", "done", "cancelled"]);

export const taskSortSchema = z.enum(["due", "updated", "priority", "created"]);

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(20000).optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: z.number().int().min(0).max(5).optional(),
  dueAt: taskDateTimeInputSchema.optional(),
  goalId: idStringSchema.optional().nullable(),
  parentTaskId: idStringSchema.optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(64)).max(32).optional(),
});

export const taskPatchSchema = taskCreateSchema.partial().extend({
  completedAt: taskDateTimeInputSchema.optional(),
});

export const taskListQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  goalId: z.string().regex(/^\d+$/).optional(),
  parentTaskId: z.string().regex(/^\d+$/).optional(),
  /** When true, only root tasks (`parent_task_id` IS NULL). Ignored if `parentTaskId` is set. */
  rootsOnly: z.enum(["true", "false"]).optional(),
  /** Case-insensitive substring match on title. */
  q: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  sort: taskSortSchema.optional(),
});
