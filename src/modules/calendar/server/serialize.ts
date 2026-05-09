import { iso } from "@/modules/shared/server/serialize-helpers";

export interface CalendarEventRow {
  id: bigint;
  user_id: bigint;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: Date;
  ends_at: Date;
  all_day: boolean;
  color: string;
  task_id: bigint | null;
  goal_id: bigint | null;
  created_at: Date;
  updated_at: Date;
}

export function serializeCalendarEvent(r: CalendarEventRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    title: r.title,
    description: r.description,
    location: r.location,
    startsAt: iso(r.starts_at),
    endsAt: iso(r.ends_at),
    allDay: r.all_day,
    color: r.color,
    taskId: r.task_id != null ? String(r.task_id) : null,
    goalId: r.goal_id != null ? String(r.goal_id) : null,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}
