"use client";

import { useCallback, useEffect, useState } from "react";
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

  if (loading) return <p className="text-sm text-zinc-500">Loading tasks…</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Capture work, filter by status, and complete items in one place.
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">Status</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        >
          <option value="">All</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </div>
      <form onSubmit={addTask} className="flex flex-wrap gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task…"
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Add
        </button>
      </form>
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {tasks.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void markDone(t)}
                className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                  t.status === "done"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-zinc-400"
                }`}
              >
                {t.status === "done" ? "✓" : ""}
              </button>
              <div>
                <p className={t.status === "done" ? "text-zinc-400 line-through" : "font-medium"}>{t.title}</p>
                <p className="text-xs text-zinc-500">
                  {t.status}
                  {t.dueAt ? ` · due ${new Date(t.dueAt).toLocaleString()}` : ""}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => void remove(t.id)} className="text-xs text-red-600 dark:text-red-400">
              Delete
            </button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && <p className="text-sm text-zinc-500">No tasks in this view.</p>}
    </div>
  );
}
