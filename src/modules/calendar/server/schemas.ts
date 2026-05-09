import { z } from "zod";

const idString = z.string().regex(/^\d+$/);

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
