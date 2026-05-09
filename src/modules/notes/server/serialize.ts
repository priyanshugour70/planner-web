import { iso } from "@/modules/shared/server/serialize-helpers";

export interface NoteRow {
  id: bigint;
  user_id: bigint;
  title: string;
  body: string;
  pinned: boolean;
  color: string | null;
  created_at: Date;
  updated_at: Date;
}

export function serializeNote(r: NoteRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    title: r.title,
    body: r.body,
    pinned: r.pinned,
    color: r.color,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}
