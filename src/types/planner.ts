export type GoalDTO = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  targetDate: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

export type MilestoneDTO = {
  id: string;
  goalId: string;
  title: string;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskDTO = {
  id: string;
  userId: string;
  goalId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  dueAt: string | null;
  completedAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type BudgetDTO = {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  amountLimit: string;
  periodStart: string | null;
  periodEnd: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionDTO = {
  id: string;
  userId: string;
  budgetId: string | null;
  kind: string;
  amount: string;
  category: string | null;
  note: string | null;
  occurredOn: string | null;
  createdAt: string;
};

export type HabitDTO = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  frequency: string;
  targetPerWeek: number | null;
  createdAt: string;
  updatedAt: string;
};

export type HabitEntryDTO = {
  id: string;
  habitId: string;
  entryDate: string | null;
  count: number;
  note: string | null;
  createdAt: string;
};

export type JournalEntryDTO = {
  id: string;
  userId: string;
  title: string;
  body: string;
  mood: string | null;
  entryDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type NoteDTO = {
  id: string;
  userId: string;
  title: string;
  body: string;
  pinned: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventDTO = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  allDay: boolean;
  color: string;
  taskId: string | null;
  goalId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlannerSummaryDTO = {
  goals: number;
  tasks: number;
  tasksDone: number;
  budgets: number;
  transactions: number;
  habits: number;
  journalEntries: number;
  notes: number;
  calendarEvents: number;
  totalIncome: string;
  totalExpense: string;
};
