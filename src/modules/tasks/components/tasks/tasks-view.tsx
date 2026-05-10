"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useGoals } from "@/modules/goals/hooks/use-goals";
import { useTasks } from "@/modules/tasks/hooks/use-tasks";
import { useTasksStore } from "@/modules/tasks/stores/tasks-store";
import { formatDisplayDate } from "@/lib/format-display-date";
import { cn } from "@/lib/utils";
import type { GoalDTO, TaskDTO } from "@/types/planner";

const NONE = "__none__";

function parseTags(raw: string): string[] | undefined {
  const t = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return t.length ? t : undefined;
}

function statusLabel(s: string): string {
  switch (s) {
    case "in_progress":
      return "In progress";
    case "todo":
      return "Todo";
    case "done":
      return "Done";
    case "cancelled":
      return "Cancelled";
    default:
      return s;
  }
}

function filterSummaryLine(
  filterStatus: string,
  rootsOnly: boolean,
  search: string,
  goalIdFilter: string,
  goals: { id: string; title: string }[]
): string {
  const parts: string[] = [];
  if (filterStatus) parts.push(statusLabel(filterStatus));
  if (rootsOnly) parts.push("Roots only");
  if (goalIdFilter) parts.push(goals.find((g) => g.id === goalIdFilter)?.title ?? "Goal");
  if (search.trim()) parts.push(`Search "${search.trim().slice(0, 24)}${search.trim().length > 24 ? "…" : ""}"`);
  return parts.length ? parts.join(" · ") : "Defaults";
}

export function TasksView() {
  const goals = useGoals();
  const {
    tasks,
    filterStatus,
    sort,
    search,
    rootsOnly,
    goalIdFilter,
    loading,
    setFilterStatus,
    setSort,
    setSearch,
    setRootsOnly,
    setGoalIdFilter,
    load,
    createTask,
    updateTask,
    remove,
  } = useTasks();

  const quickCreateRequest = useTasksStore((s) => s.quickCreateRequest);
  const requestQuickCreate = useTasksStore((s) => s.requestQuickCreate);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("2");
  const [due, setDue] = useState("");
  const [goalId, setGoalId] = useState<string>(NONE);
  const [parentTaskId, setParentTaskId] = useState<string>(NONE);
  const [tagsCsv, setTagsCsv] = useState("");
  const [createStatus, setCreateStatus] = useState<"todo" | "in_progress" | "done" | "cancelled">("todo");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TaskDTO | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eStatus, setEStatus] = useState<string>("todo");
  const [ePriority, setEPriority] = useState("2");
  const [eDue, setEDue] = useState("");
  const [eGoalId, setEGoalId] = useState<string>(NONE);
  const [eParentTaskId, setEParentTaskId] = useState<string>(NONE);
  const [eTagsCsv, setETagsCsv] = useState("");

  const goalById = useMemo(() => {
    const m = new Map<string, GoalDTO>();
    for (const g of goals.goals) m.set(g.id, g);
    return m;
  }, [goals.goals]);

  const parentOptions = useMemo(() => {
    return tasks.filter((t) => !editing || t.id !== editing.id);
  }, [tasks, editing]);

  useEffect(() => {
    if (quickCreateRequest === 0) return;
    setCreateOpen(true);
    const t = window.setTimeout(() => {
      document.getElementById("task-create-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("task-new-title")?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [quickCreateRequest]);

  function openEdit(t: TaskDTO) {
    setEditing(t);
    setETitle(t.title);
    setEDescription(t.description ?? "");
    setEStatus(t.status);
    setEPriority(String(t.priority));
    setEDue(t.dueAt && t.dueAt.length >= 10 ? t.dueAt.slice(0, 10) : "");
    setEGoalId(t.goalId ?? NONE);
    setEParentTaskId(t.parentTaskId ?? NONE);
    setETagsCsv((t.tags ?? []).join(", "));
    setEditOpen(true);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const tags = parseTags(tagsCsv);
    const body: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      status: createStatus,
      priority: Number(priority) || 2,
      dueAt: due.trim() ? due.trim() : null,
      goalId: goalId === NONE ? null : goalId,
      parentTaskId: parentTaskId === NONE ? null : parentTaskId,
    };
    if (tags) body.tags = tags;
    const ok = await createTask(body);
    if (ok) {
      setTitle("");
      setDescription("");
      setPriority("2");
      setDue("");
      setGoalId(NONE);
      setParentTaskId(NONE);
      setTagsCsv("");
      setCreateStatus("todo");
      setCreateOpen(false);
    }
  }

  async function onSaveEdit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editing) return;
    const tags = parseTags(eTagsCsv);
    const body: Record<string, unknown> = {
      title: eTitle.trim(),
      description: eDescription.trim() || null,
      status: eStatus,
      priority: Number(ePriority) || 2,
      dueAt: eDue.trim() ? eDue.trim() : null,
      goalId: eGoalId === NONE ? null : eGoalId,
      parentTaskId: eParentTaskId === NONE ? null : eParentTaskId,
    };
    if (tags) body.tags = tags;
    const ok = await updateTask(editing.id, body);
    if (ok) setEditOpen(false);
  }

  async function onToggleDone(t: TaskDTO) {
    const next = t.status === "done" ? "todo" : "done";
    await updateTask(t.id, { status: next });
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 px-3 pb-40 sm:px-5 lg:px-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 max-w-md" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-5 px-3 pb-40 sm:space-y-6 sm:px-5 sm:pb-44 lg:px-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tasks</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Tap <span className="font-medium text-foreground">Filters</span> or <span className="font-medium text-foreground">New task</span> when needed. Use the + button to jump straight to creating a task.
        </p>
      </header>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 sm:px-5 sm:py-4 touch-manipulation"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Filters &amp; search</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{filterSummaryLine(filterStatus, rootsOnly, search, goalIdFilter, goals.goals)}</p>
          </div>
          {filtersOpen ? <ChevronUp className="size-5 shrink-0 text-muted-foreground" aria-hidden /> : <ChevronDown className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
        </button>
        {filtersOpen ? (
          <CardContent className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <FieldLabel>Status</FieldLabel>
            <FieldContent>
              <Select
                value={filterStatus === "" ? "all" : filterStatus}
                onValueChange={(v) => setFilterStatus(v == null || v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" sideOffset={4}>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Goal</FieldLabel>
            <FieldContent>
              <Select
                value={goalIdFilter === "" ? "all" : goalIdFilter}
                onValueChange={(v) => setGoalIdFilter(v == null || v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any goal" />
                </SelectTrigger>
                <SelectContent align="start" sideOffset={4}>
                  <SelectItem value="all">Any goal</SelectItem>
                  {goals.goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Sort</FieldLabel>
            <FieldContent>
              <Select value={sort} onValueChange={(v) => setSort((v ?? "due") as typeof sort)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" sideOffset={4}>
                  <SelectItem value="due">Due date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="updated">Recently updated</SelectItem>
                  <SelectItem value="created">Recently created</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          <Field className="sm:col-span-2 lg:col-span-2">
            <FieldLabel htmlFor="task-search">Search title</FieldLabel>
            <FieldContent>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="task-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Substring match…"
                  className="min-w-0 flex-1"
                />
                <Button type="button" variant="secondary" className="shrink-0 touch-manipulation" onClick={() => void load()}>
                  Apply search
                </Button>
              </div>
            </FieldContent>
          </Field>
          <Field className="flex flex-row items-center gap-3 sm:col-span-2 lg:col-span-1">
            <Checkbox id="roots-only" checked={rootsOnly} onCheckedChange={(c) => setRootsOnly(c === true)} />
            <FieldLabel htmlFor="roots-only" className="cursor-pointer font-normal">
              Root tasks only (no parent)
            </FieldLabel>
          </Field>
        </CardContent>
        ) : null}
      </Card>

      <Card id="task-create-anchor" className="overflow-hidden border-border/70 shadow-sm scroll-mt-24">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 sm:px-5 sm:py-4 touch-manipulation"
          onClick={() => setCreateOpen((o) => !o)}
          aria-expanded={createOpen}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">New task</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Expand to add, or use the + button below.</p>
          </div>
          {createOpen ? <ChevronUp className="size-5 shrink-0 text-muted-foreground" aria-hidden /> : <ChevronDown className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
        </button>
        {createOpen ? (
          <CardContent className="border-t border-border/60 pt-4">
          <form onSubmit={(e) => void onCreate(e)} className="grid gap-4 lg:grid-cols-2">
            <Field className="lg:col-span-2">
              <FieldLabel htmlFor="task-new-title">Title</FieldLabel>
              <FieldContent>
                <Input id="task-new-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ship weekly report" required />
              </FieldContent>
            </Field>
            <Field className="lg:col-span-2">
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional details…" />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <FieldContent>
                <Select value={createStatus} onValueChange={(v) => setCreateStatus((v as typeof createStatus) ?? "todo")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Priority (0–5)</FieldLabel>
              <FieldContent>
                <Select value={priority} onValueChange={(v) => setPriority(v ?? "2")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    {["0", "1", "2", "3", "4", "5"].map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field className="lg:col-span-2">
              <DatePickerField id="nt-due" label="Due date (optional)" value={due} onChange={setDue} />
            </Field>
            <Field>
              <FieldLabel>Goal</FieldLabel>
              <FieldContent>
                <Select value={goalId} onValueChange={(v) => setGoalId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {goals.goals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Parent task</FieldLabel>
              <FieldContent>
                <Select value={parentTaskId} onValueChange={(v) => setParentTaskId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {parentOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field className="lg:col-span-2">
              <FieldLabel>Tags (comma-separated)</FieldLabel>
              <FieldContent>
                <Input value={tagsCsv} onChange={(e) => setTagsCsv(e.target.value)} placeholder="deep-work, q1" />
              </FieldContent>
            </Field>
            <div className="lg:col-span-2">
              <Button type="submit" className="touch-manipulation">
                Create task
              </Button>
            </div>
          </form>
          </CardContent>
        ) : null}
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your tasks</CardTitle>
          <CardDescription>{tasks.length} shown (server limit 250).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[min(42rem,70vh)] w-full sm:h-[min(38rem,65vh)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12" />
                  <TableHead>Task</TableHead>
                  <TableHead className="hidden w-28 md:table-cell">Status</TableHead>
                  <TableHead className="hidden w-20 lg:table-cell">Pri</TableHead>
                  <TableHead className="hidden w-36 lg:table-cell">Due</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No tasks match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((t) => (
                    <TableRow key={t.id} className={cn(t.status === "done" && "opacity-70")}>
                      <TableCell>
                        <Checkbox
                          checked={t.status === "done"}
                          onCheckedChange={() => void onToggleDone(t)}
                          aria-label={t.status === "done" ? "Mark not done" : "Mark done"}
                        />
                      </TableCell>
                      <TableCell>
                        <p className={cn("font-medium", t.status === "done" && "text-muted-foreground line-through")}>{t.title}</p>
                        {t.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {t.goalId ? (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {goalById.get(t.goalId)?.title ?? "Goal"}
                            </Badge>
                          ) : null}
                          {(t.tags ?? []).slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground md:hidden">
                          {statusLabel(t.status)} · P{t.priority}
                          {t.dueAt ? ` · Due ${formatDisplayDate(t.dueAt)}` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{statusLabel(t.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{t.priority}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {t.dueAt ? formatDisplayDate(t.dueAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="outline" size="sm" className="touch-manipulation" onClick={() => openEdit(t)}>
                            Edit
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="touch-manipulation text-destructive" onClick={() => void remove(t.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Changes sync to all your devices using the same account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void onSaveEdit(e)} className="grid gap-3">
            <Field>
              <FieldLabel>Title</FieldLabel>
              <FieldContent>
                <Input value={eTitle} onChange={(e) => setETitle(e.target.value)} required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <Textarea value={eDescription} onChange={(e) => setEDescription(e.target.value)} rows={3} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <FieldContent>
                <Select value={eStatus} onValueChange={(v) => setEStatus(v ?? "todo")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <FieldContent>
                <Select value={ePriority} onValueChange={(v) => setEPriority(v ?? "2")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    {["0", "1", "2", "3", "4", "5"].map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <DatePickerField id="et-due" label="Due date" value={eDue} onChange={setEDue} />
            <Field>
              <FieldLabel>Goal</FieldLabel>
              <FieldContent>
                <Select value={eGoalId} onValueChange={(v) => setEGoalId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {goals.goals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Parent task</FieldLabel>
              <FieldContent>
                <Select value={eParentTaskId} onValueChange={(v) => setEParentTaskId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {parentOptions.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Tags</FieldLabel>
              <FieldContent>
                <Input value={eTagsCsv} onChange={(e) => setETagsCsv(e.target.value)} />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button
        type="button"
        size="icon"
        className="fixed z-50 h-14 w-14 rounded-full shadow-lg touch-manipulation right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[calc(max(1rem,env(safe-area-inset-bottom,0px))+3rem+0.75rem)] md:right-6 md:bottom-[calc(1.5rem+3rem+0.75rem)]"
        aria-label="New task"
        onClick={() => requestQuickCreate()}
      >
        <Plus className="size-7" aria-hidden />
      </Button>
    </div>
  );
}
