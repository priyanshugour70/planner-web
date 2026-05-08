"use client";

import { useCallback, useEffect, useState } from "react";
import * as Planner from "@/services/planner.service";
import type { NoteDTO } from "@/types/planner";

export function NotesView() {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await Planner.fetchNotes();
    if (res.success && res.data) setNotes(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await Planner.createNote({ title: title.trim(), body });
    if (res.success) {
      setTitle("");
      setBody("");
      await load();
    }
  }

  async function togglePin(n: NoteDTO) {
    const res = await Planner.updateNote(n.id, { pinned: !n.pinned });
    if (res.success) await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete note?")) return;
    const res = await Planner.deleteNote(id);
    if (res.success) await load();
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading notes…</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Quick capture; pin important notes to the top.
        </p>
      </header>
      <form onSubmit={add} className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body"
          rows={3}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Save note
        </button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2">
        {notes.map((n) => (
          <article
            key={n.id}
            className={`rounded-xl border p-4 ${n.pinned ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"}`}
          >
            <div className="flex justify-between gap-2">
              <h2 className="font-semibold">{n.title}</h2>
              <div className="flex gap-2">
                <button type="button" className="text-xs text-zinc-500" onClick={() => void togglePin(n)}>
                  {n.pinned ? "Unpin" : "Pin"}
                </button>
                <button type="button" className="text-xs text-red-600" onClick={() => void remove(n.id)}>
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{n.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
