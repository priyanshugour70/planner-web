"use client";

import { useCallback, useEffect, useState } from "react";
import * as Planner from "@/services/planner.service";
import type { HabitDTO, HabitEntryDTO } from "@/types/planner";

export function HabitsView() {
  const [habits, setHabits] = useState<HabitDTO[]>([]);
  const [entries, setEntries] = useState<Record<string, HabitEntryDTO[]>>({});
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await Planner.fetchHabits();
    if (res.success && res.data) {
      setHabits(res.data);
      const en: Record<string, HabitEntryDTO[]> = {};
      for (const h of res.data) {
        const er = await Planner.fetchHabitEntries(h.id);
        if (er.success && er.data) en[h.id] = er.data;
      }
      setEntries(en);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await Planner.createHabit({ name: name.trim() });
    if (res.success) {
      setName("");
      await load();
    }
  }

  async function logToday(habitId: string) {
    const d = new Date().toISOString().slice(0, 10);
    const res = await Planner.logHabitEntry(habitId, { entryDate: d, count: 1 });
    if (res.success) await load();
  }

  async function removeHabit(id: string) {
    if (!confirm("Delete habit and its history?")) return;
    const res = await Planner.deleteHabit(id);
    if (res.success) await load();
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading habits…</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Track streaks with one tap per day. Entries upsert by date.
        </p>
      </header>
      <form onSubmit={add} className="flex gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Morning run, read 20 pages…"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Add habit
        </button>
      </form>
      <ul className="space-y-4">
        {habits.map((h) => (
          <li
            key={h.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: h.color }} />
                <h2 className="font-semibold">{h.name}</h2>
                <span className="text-xs text-zinc-500">{h.frequency}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void logToday(h.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white"
                >
                  Log today
                </button>
                <button type="button" onClick={() => void removeHabit(h.id)} className="text-xs text-red-600">
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Recent: {(entries[h.id] ?? []).slice(0, 7).map((e) => `${e.entryDate}×${e.count}`).join(" · ") || "—"}
            </p>
          </li>
        ))}
      </ul>
      {habits.length === 0 && <p className="text-sm text-zinc-500">No habits yet.</p>}
    </div>
  );
}
