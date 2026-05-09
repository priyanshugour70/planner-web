import { z } from "zod";

export const journalCreateSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().max(100000).optional(),
  mood: z.string().max(64).optional().nullable(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tags: z.array(z.string().max(64)).max(32).optional(),
});

export const journalPatchSchema = journalCreateSchema.partial();
