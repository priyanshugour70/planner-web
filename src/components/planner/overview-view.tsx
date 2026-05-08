"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Planner from "@/services/planner.service";
import type { PlannerSummaryDTO } from "@/types/planner";

const links = [
  { href: "/goals", label: "Goals", key: "goals" as const },
  { href: "/tasks", label: "Tasks", key: "tasks" as const },
  { href: "/finance", label: "Finance", key: "transactions" as const },
  { href: "/habits", label: "Habits", key: "habits" as const },
  { href: "/journal", label: "Journal", key: "journalEntries" as const },
  { href: "/notes", label: "Notes", key: "notes" as const },
  { href: "/calendar", label: "Calendar", key: "calendarEvents" as const },
];

export function OverviewView() {
  const [s, setS] = useState<PlannerSummaryDTO | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await Planner.fetchSummary();
      if (res.success && res.data) setS(res.data);
    })();
  }, []);

  if (!s) return <p className="text-sm text-zinc-500">Loading overview…</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Counts across your workspace. Open any module from the sidebar or below.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tasks done</p>
          <p className="mt-2 text-3xl font-semibold">
            {s.tasksDone}
            <span className="text-lg font-normal text-zinc-400">/{s.tasks}</span>
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Income vs expense</p>
          <p className="mt-2 text-sm text-emerald-600">+{s.totalIncome}</p>
          <p className="text-sm text-red-600">−{s.totalExpense}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Goals</p>
          <p className="mt-2 text-3xl font-semibold">{s.goals}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Habits</p>
          <p className="mt-2 text-3xl font-semibold">{s.habits}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            {l.label}
            <span className="text-zinc-400">{s[l.key]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
