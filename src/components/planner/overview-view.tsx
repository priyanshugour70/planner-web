"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as Planner from "@/services/planner.service";
import type { PlannerSummaryDTO } from "@/types/planner";
import { cn } from "@/lib/utils";

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

  if (!s) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 max-w-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Counts across your workspace. Open any module from the sidebar or below.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasks done</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {s.tasksDone}
              <span className="text-lg font-normal text-muted-foreground">/{s.tasks}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Income vs expense</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">+{s.totalIncome}</p>
            <p className="text-sm font-medium text-destructive">−{s.totalExpense}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Goals</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{s.goals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Habits</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{s.habits}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto justify-between gap-3 py-4 font-medium"
            )}
          >
            <span>{l.label}</span>
            <Badge variant="secondary" className="tabular-nums">
              {s[l.key]}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
