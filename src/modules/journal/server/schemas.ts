import { z } from "zod";

export const moodSchema = z.enum(["amazing", "good", "neutral", "bad", "terrible"]);

export const journalCreateSchema = z.object({
  title: z.string().max(500).optional(),
  body: z.string().max(100000).optional(),
  mood: moodSchema.optional().nullable(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tags: z.array(z.string().max(64)).max(32).optional(),
  isFavorite: z.boolean().optional(),
  prompt: z.string().max(500).optional().nullable(),
  energyLevel: z.number().int().min(1).max(5).optional().nullable(),
  weather: z.string().max(64).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
});

export const journalPatchSchema = journalCreateSchema.partial();

export const journalListQuerySchema = z.object({
  mood: moodSchema.optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  favoritesOnly: z.enum(["true", "false"]).optional(),
  /** Case-insensitive substring match on title or body. */
  q: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  tags: z.string().optional(),
});
