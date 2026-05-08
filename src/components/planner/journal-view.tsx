"use client";

import { useCallback, useEffect, useState } from "react";
import * as Planner from "@/services/planner.service";
import type { JournalEntryDTO } from "@/types/planner";

export function JournalView() {
  const [entries, setEntries] = useState<JournalEntryDTO[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await Planner.fetchJournal();
    if (res.success && res.data) setEntries(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await Planner.createJournalEntry({ title: title || "Entry", body });
    if (res.success) {
      setTitle("");
      setBody("");
      await load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete entry?")) return;
    const res = await Planner.deleteJournalEntry(id);
    if (res.success) await load();
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading journal…</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Reflect by day; long-form body with optional mood and tags (via API).
        </p>
      </header>
      <form onSubmit={save} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write freely…"
          rows={6}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Save entry
        </button>
      </form>
      <ul className="space-y-3">
        {entries.map((j) => (
          <li key={j.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex justify-between gap-2">
              <h2 className="font-semibold">{j.title || "Untitled"}</h2>
              <button type="button" onClick={() => void remove(j.id)} className="text-xs text-red-600">
                Delete
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{j.body}</p>
            <p className="mt-2 text-xs text-zinc-500">{j.entryDate}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
