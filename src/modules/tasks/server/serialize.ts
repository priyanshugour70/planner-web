import { iso } from "@/modules/shared/server/serialize-helpers";

export interface TaskRow {
  id: bigint;
  user_id: bigint;
  goal_id: bigint | null;
  parent_task_id: bigint | null;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  due_at: Date | null;
  completed_at: Date | null;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export function serializeTask(r: TaskRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    goalId: r.goal_id != null ? String(r.goal_id) : null,
    parentTaskId: r.parent_task_id != null ? String(r.parent_task_id) : null,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    dueAt: iso(r.due_at),
    completedAt: iso(r.completed_at),
    tags: r.tags ?? [],
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}
