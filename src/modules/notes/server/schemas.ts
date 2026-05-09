import { z } from "zod";

export const noteCreateSchema = z.object({
  title: z.string().trim().min(1).max(500),
  body: z.string().max(100000).optional(),
  pinned: z.boolean().optional(),
  color: z.string().max(32).optional().nullable(),
});

export const notePatchSchema = noteCreateSchema.partial();
