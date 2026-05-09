import { iso, isoDate } from "@/modules/shared/server/serialize-helpers";

export interface GoalRow {
  id: bigint;
  user_id: bigint;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  target_date: Date | null;
  progress: number;
  created_at: Date;
  updated_at: Date;
}

export interface MilestoneRow {
  id: bigint;
  goal_id: bigint;
  title: string;
  due_date: Date | null;
  completed_at: Date | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export function serializeGoal(r: GoalRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    targetDate: isoDate(r.target_date),
    progress: r.progress,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

export function serializeMilestone(r: MilestoneRow) {
  return {
    id: String(r.id),
    goalId: String(r.goal_id),
    title: r.title,
    dueDate: isoDate(r.due_date),
    completedAt: iso(r.completed_at),
    sortOrder: r.sort_order,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}
