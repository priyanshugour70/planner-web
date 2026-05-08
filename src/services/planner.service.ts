import { apiRequest } from "@/lib/client/http";
import type {
  BudgetDTO,
  CalendarEventDTO,
  GoalDTO,
  HabitDTO,
  HabitEntryDTO,
  JournalEntryDTO,
  MilestoneDTO,
  NoteDTO,
  PlannerSummaryDTO,
  TaskDTO,
  TransactionDTO,
} from "@/types/planner";
import type { APIEnvelope } from "@/types/api-response";

function q(params: Record<string, string | undefined>): string {
  const e = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") e.set(k, v);
  }
  const s = e.toString();
  return s ? `?${s}` : "";
}

export async function fetchSummary(): Promise<APIEnvelope<PlannerSummaryDTO>> {
  return apiRequest<PlannerSummaryDTO>("/planner/summary");
}

export async function fetchGoals(status?: string): Promise<APIEnvelope<GoalDTO[]>> {
  return apiRequest<GoalDTO[]>(`/planner/goals${q({ status })}`);
}

export async function createGoal(
  body: Record<string, unknown>
): Promise<APIEnvelope<GoalDTO>> {
  return apiRequest<GoalDTO>("/planner/goals", { method: "POST", body: JSON.stringify(body) });
}

export async function updateGoal(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<GoalDTO>> {
  return apiRequest<GoalDTO>(`/planner/goals/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteGoal(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/goals/${id}`, { method: "DELETE" });
}

export async function fetchMilestones(goalId: string): Promise<APIEnvelope<MilestoneDTO[]>> {
  return apiRequest<MilestoneDTO[]>(`/planner/goals/${goalId}/milestones`);
}

export async function createMilestone(
  goalId: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<MilestoneDTO>> {
  return apiRequest<MilestoneDTO>(`/planner/goals/${goalId}/milestones`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateMilestone(
  goalId: string,
  milestoneId: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<MilestoneDTO>> {
  return apiRequest<MilestoneDTO>(`/planner/goals/${goalId}/milestones/${milestoneId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteMilestone(
  goalId: string,
  milestoneId: string
): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/goals/${goalId}/milestones/${milestoneId}`, {
    method: "DELETE",
  });
}

export async function fetchTasks(filters?: {
  status?: string;
  goalId?: string;
}): Promise<APIEnvelope<TaskDTO[]>> {
  return apiRequest<TaskDTO[]>(`/planner/tasks${q(filters ?? {})}`);
}

export async function createTask(
  body: Record<string, unknown>
): Promise<APIEnvelope<TaskDTO>> {
  return apiRequest<TaskDTO>("/planner/tasks", { method: "POST", body: JSON.stringify(body) });
}

export async function updateTask(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<TaskDTO>> {
  return apiRequest<TaskDTO>(`/planner/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteTask(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/tasks/${id}`, { method: "DELETE" });
}

export async function fetchBudgets(): Promise<APIEnvelope<BudgetDTO[]>> {
  return apiRequest<BudgetDTO[]>("/planner/budgets");
}

export async function createBudget(
  body: Record<string, unknown>
): Promise<APIEnvelope<BudgetDTO>> {
  return apiRequest<BudgetDTO>("/planner/budgets", { method: "POST", body: JSON.stringify(body) });
}

export async function updateBudget(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<BudgetDTO>> {
  return apiRequest<BudgetDTO>(`/planner/budgets/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteBudget(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/budgets/${id}`, { method: "DELETE" });
}

export async function fetchTransactions(from?: string, to?: string): Promise<APIEnvelope<TransactionDTO[]>> {
  return apiRequest<TransactionDTO[]>(`/planner/transactions${q({ from, to })}`);
}

export async function createTransaction(
  body: Record<string, unknown>
): Promise<APIEnvelope<TransactionDTO>> {
  return apiRequest<TransactionDTO>("/planner/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteTransaction(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/transactions/${id}`, { method: "DELETE" });
}

export async function fetchHabits(): Promise<APIEnvelope<HabitDTO[]>> {
  return apiRequest<HabitDTO[]>("/planner/habits");
}

export async function createHabit(
  body: Record<string, unknown>
): Promise<APIEnvelope<HabitDTO>> {
  return apiRequest<HabitDTO>("/planner/habits", { method: "POST", body: JSON.stringify(body) });
}

export async function updateHabit(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<HabitDTO>> {
  return apiRequest<HabitDTO>(`/planner/habits/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteHabit(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/habits/${id}`, { method: "DELETE" });
}

export async function fetchHabitEntries(habitId: string): Promise<APIEnvelope<HabitEntryDTO[]>> {
  return apiRequest<HabitEntryDTO[]>(`/planner/habits/${habitId}/entries`);
}

export async function logHabitEntry(
  habitId: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<HabitEntryDTO>> {
  return apiRequest<HabitEntryDTO>(`/planner/habits/${habitId}/entries`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteHabitEntry(
  habitId: string,
  entryId: string
): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/habits/${habitId}/entries/${entryId}`, { method: "DELETE" });
}

export async function fetchJournal(): Promise<APIEnvelope<JournalEntryDTO[]>> {
  return apiRequest<JournalEntryDTO[]>("/planner/journal");
}

export async function createJournalEntry(
  body: Record<string, unknown>
): Promise<APIEnvelope<JournalEntryDTO>> {
  return apiRequest<JournalEntryDTO>("/planner/journal", { method: "POST", body: JSON.stringify(body) });
}

export async function updateJournalEntry(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<JournalEntryDTO>> {
  return apiRequest<JournalEntryDTO>(`/planner/journal/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteJournalEntry(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/journal/${id}`, { method: "DELETE" });
}

export async function fetchNotes(): Promise<APIEnvelope<NoteDTO[]>> {
  return apiRequest<NoteDTO[]>("/planner/notes");
}

export async function createNote(body: Record<string, unknown>): Promise<APIEnvelope<NoteDTO>> {
  return apiRequest<NoteDTO>("/planner/notes", { method: "POST", body: JSON.stringify(body) });
}

export async function updateNote(
  id: string,
  body: Record<string, unknown>
): Promise<APIEnvelope<NoteDTO>> {
  return apiRequest<NoteDTO>(`/planner/notes/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteNote(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/notes/${id}`, { method: "DELETE" });
}

export async function fetchCalendarEvents(
  from?: string,
  to?: string
): Promise<APIEnvelope<CalendarEventDTO[]>> {
  return apiRequest<CalendarEventDTO[]>(`/planner/calendar-events${q({ from, to })}`);
}

export async function createCalendarEvent(
  body: Record<string, unknown>
): Promise<APIEnvelope<CalendarEventDTO>> {
  return apiRequest<CalendarEventDTO>("/planner/calendar-events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteCalendarEvent(id: string): Promise<APIEnvelope<{ ok: true }>> {
  return apiRequest<{ ok: true }>(`/planner/calendar-events/${id}`, { method: "DELETE" });
}
