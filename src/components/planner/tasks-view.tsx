"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as Planner from "@/services/planner.service";
import type { TaskDTO } from "@/types/planner";

export function TasksView() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await Planner.fetchTasks(filter ? { status: filter } : {});
    if (res.success && res.data) setTasks(res.data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await Planner.createTask({ title: title.trim(), status: "todo" });
    if (res.success) {
      setTitle("");
      await load();
    }
  }

  async function markDone(t: TaskDTO) {
    const res = await Planner.updateTask(t.id, {
      status: t.status === "done" ? "todo" : "done",
      completedAt: t.status === "done" ? null : new Date().toISOString(),
    });
    if (res.success) await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete task?")) return;
    const res = await Planner.deleteTask(id);
    if (res.success) await load();
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 max-w-md" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture work, filter by status, and complete items in one place.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-4">
        <Field className="min-w-[12rem] max-w-xs">
          <FieldLabel>Status</FieldLabel>
          <FieldContent>
            <Select
              value={filter === "" ? "all" : filter}
              onValueChange={(v) => setFilter(v == null || v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent align="start" sideOffset={4}>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add task</CardTitle>
          <CardDescription>Creates a new item with status “todo”.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addTask} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="new-task">Title</FieldLabel>
              <FieldContent>
                <Input
                  id="new-task"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="New task…"
                />
              </FieldContent>
            </Field>
            <Button type="submit" className="shrink-0">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Task</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Checkbox
                      checked={t.status === "done"}
                      onCheckedChange={() => void markDone(t)}
                      aria-label={t.status === "done" ? "Mark as todo" : "Mark as done"}
                    />
                  </TableCell>
                  <TableCell>
                    <p className={t.status === "done" ? "text-muted-foreground line-through" : "font-medium"}>
                      {t.title}
                    </p>
                    <p className="text-xs text-muted-foreground sm:hidden">{t.status}</p>
                    {t.dueAt ? (
                      <p className="text-xs text-muted-foreground">Due {new Date(t.dueAt).toLocaleString()}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{t.status}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void remove(t.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks in this view.</p>
      ) : null}
    </div>
  );
}
