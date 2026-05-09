import { iso, isoDate } from "@/modules/shared/server/serialize-helpers";

export interface HabitRow {
  id: bigint;
  user_id: bigint;
  name: string;
  description: string | null;
  color: string;
  frequency: string;
  target_per_week: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface HabitEntryRow {
  id: bigint;
  habit_id: bigint;
  entry_date: Date;
  count: number;
  note: string | null;
  created_at: Date;
}

export function serializeHabit(r: HabitRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    name: r.name,
    description: r.description,
    color: r.color,
    frequency: r.frequency,
    targetPerWeek: r.target_per_week,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

export function serializeHabitEntry(r: HabitEntryRow) {
  return {
    id: String(r.id),
    habitId: String(r.habit_id),
    entryDate: isoDate(r.entry_date),
    count: r.count,
    note: r.note,
    createdAt: iso(r.created_at),
  };
}
