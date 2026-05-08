"use client";

import { useCallback, useEffect, useState } from "react";
import * as Planner from "@/services/planner.service";
import type { GoalDTO, MilestoneDTO } from "@/types/planner";

export function GoalsView() {
  const [goals, setGoals] = useState<GoalDTO[]>([]);
  const [milestones, setMilestones] = useState<Record<string, MilestoneDTO[]>>({});
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await Planner.fetchGoals();
    if (res.success && res.data) {
      setGoals(res.data);
      const ms: Record<string, MilestoneDTO[]> = {};
      for (const g of res.data) {
        const mr = await Planner.fetchMilestones(g.id);
        if (mr.success && mr.data) ms[g.id] = mr.data;
      }
      setMilestones(ms);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await Planner.createGoal({ title: title.trim(), status: "active" });
    setMsg(res.success ? "Goal added" : res.message);
    if (res.success) {
      setTitle("");
      await load();
    }
  }

  async function toggleMilestone(gid: string, m: MilestoneDTO) {
    const res = await Planner.updateMilestone(gid, m.id, {
      completedAt: m.completedAt ? null : new Date().toISOString(),
    });
    if (res.success) await load();
  }

  async function addMilestone(goalId: string, titleM: string) {
    if (!titleM.trim()) return;
    const res = await Planner.createMilestone(goalId, { title: titleM.trim() });
    if (res.success) await load();
  }

  async function removeGoal(id: string) {
    if (!confirm("Delete this goal and its milestones?")) return;
    const res = await Planner.deleteGoal(id);
    if (res.success) await load();
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading goals…</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Define outcomes, track progress, and break work into milestones.
        </p>
      </header>
      {msg && <p className="text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
      <form onSubmit={addGoal} className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="min-w-[200px] flex-1">
          <label className="text-xs font-medium text-zinc-500">New goal</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            placeholder="Ship v1 of Planner…"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add goal
        </button>
      </form>
      <ul className="space-y-4">
        {goals.map((g) => (
          <li
            key={g.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{g.title}</h2>
                <p className="text-xs text-zinc-500">
                  {g.status} · {g.progress}% · target {g.targetDate ?? "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void removeGoal(g.id)}
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                Delete
              </button>
            </div>
            <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-500">Milestones</p>
              <ul className="mt-2 space-y-1">
                {(milestones[g.id] ?? []).map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => void toggleMilestone(g.id, m)}
                      className={`h-4 w-4 rounded border ${m.completedAt ? "border-emerald-500 bg-emerald-500" : "border-zinc-400"}`}
                      aria-label="Toggle milestone"
                    />
                    <span className={m.completedAt ? "text-zinc-400 line-through" : ""}>{m.title}</span>
                    <span className="text-xs text-zinc-400">{m.dueDate ?? ""}</span>
                  </li>
                ))}
              </ul>
              <MilestoneQuickAdd onAdd={(t) => void addMilestone(g.id, t)} />
            </div>
          </li>
        ))}
      </ul>
      {goals.length === 0 && <p className="text-sm text-zinc-500">No goals yet. Add your first one above.</p>}
    </div>
  );
}

function MilestoneQuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(v);
        setV("");
      }}
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Milestone title"
        className="flex-1 rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
      <button type="submit" className="rounded bg-zinc-200 px-2 py-1 text-xs dark:bg-zinc-800">
        Add
      </button>
    </form>
  );
}
