import { iso, isoDate } from "@/modules/shared/server/serialize-helpers";

export interface JournalRow {
  id: bigint;
  user_id: bigint;
  title: string;
  body: string;
  mood: string | null;
  entry_date: Date;
  tags: string[];
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
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}
