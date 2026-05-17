import { iso, isoDate } from "@/modules/shared/server/serialize-helpers";

export interface JournalRow {
  id: bigint;
  user_id: bigint;
  title: string;
  body: string;
  mood: string | null;
  entry_date: Date;
  tags: string[];
  is_favorite: boolean;
  word_count: number;
  prompt: string | null;
  energy_level: number | null;
  weather: string | null;
  location: string | null;
  created_at: Date;
  updated_at: Date;
}

export function serializeJournal(r: JournalRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    title: r.title,
    body: r.body,
    mood: r.mood,
    entryDate: isoDate(r.entry_date),
    tags: r.tags ?? [],
    isFavorite: r.is_favorite ?? false,
    wordCount: r.word_count ?? 0,
    prompt: r.prompt ?? null,
    energyLevel: r.energy_level ?? null,
    weather: r.weather ?? null,
    location: r.location ?? null,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

/** Count words in a body string (simple split by whitespace). */
export function computeWordCount(body: string | null | undefined): number {
  if (!body) return 0;
  return body.trim().split(/\s+/).filter(Boolean).length;
}
