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

export interface BudgetRow {
  id: bigint;
  user_id: bigint;
  name: string;
  category: string | null;
  amount_limit: string;
  period_start: Date;
  period_end: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionRow {
  id: bigint;
  user_id: bigint;
  budget_id: bigint | null;
  kind: string;
  amount: string;
  category: string | null;
  note: string | null;
  occurred_on: Date;
  created_at: Date;
}

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

function iso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}

function isoDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
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

export function serializeBudget(r: BudgetRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    name: r.name,
    category: r.category,
    amountLimit: r.amount_limit,
    periodStart: isoDate(r.period_start),
    periodEnd: isoDate(r.period_end),
    notes: r.notes,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

export function serializeTransaction(r: TransactionRow) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    budgetId: r.budget_id != null ? String(r.budget_id) : null,
    kind: r.kind,
    amount: r.amount,
    category: r.category,
    note: r.note,
    occurredOn: isoDate(r.occurred_on),
    createdAt: iso(r.created_at),
  };
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
