"use client";

import { useCallback, useEffect, useState } from "react";
import * as Planner from "@/services/planner.service";
import type { CalendarEventDTO } from "@/types/planner";

function rangeIso(daysBack: number, daysForward: number) {
  const from = new Date(Date.now() - daysBack * 86400000);
  const to = new Date(Date.now() + daysForward * 86400000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [title, setTitle] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = rangeIso(1, 14);
    const res = await Planner.fetchCalendarEvents(from, to);
    if (res.success && res.data) setEvents(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !starts || !ends) return;
    const res = await Planner.createCalendarEvent({
      title: title.trim(),
      startsAt: new Date(starts).toISOString(),
      endsAt: new Date(ends).toISOString(),
    });
    if (res.success) {
      setTitle("");
      setStarts("");
      setEnds("");
      await load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete event?")) return;
    const res = await Planner.deleteCalendarEvent(id);
    if (res.success) await load();
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading calendar…</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Time-boxed events with optional links to tasks and goals (via API fields).
        </p>
      </header>
      <form onSubmit={add} className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="sm:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <label className="text-xs text-zinc-500">
          Starts
          <input
            type="datetime-local"
            value={starts}
            onChange={(e) => setStarts(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="text-xs text-zinc-500">
          Ends
          <input
            type="datetime-local"
            value={ends}
            onChange={(e) => setEnds(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <button type="submit" className="sm:col-span-2 rounded-lg bg-zinc-900 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Add event
        </button>
      </form>
      <ul className="space-y-2">
        {events.map((ev) => (
          <li
            key={ev.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ev.color }} />
              <span className="font-medium">{ev.title}</span>
            </div>
            <span className="text-xs text-zinc-500">
              {ev.startsAt ? new Date(ev.startsAt).toLocaleString() : ""} –{" "}
              {ev.endsAt ? new Date(ev.endsAt).toLocaleString() : ""}
            </span>
            <button type="button" onClick={() => void remove(ev.id)} className="text-xs text-red-600">
              Delete
            </button>
          </li>
        ))}
      </ul>
      {events.length === 0 && <p className="text-sm text-zinc-500">No events in the next two weeks.</p>}
    </div>
  );
}
