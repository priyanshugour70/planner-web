"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthBar } from "@/components/home/auth-bar";
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
import type { FinanceSummaryDTO, PlannerSummaryDTO } from "@/types/planner";
import { PLANNER_MODULES } from "@/lib/nav/modules";
import { cn } from "@/lib/utils";

export function AuthenticatedHome() {
  const [summary, setSummary] = useState<PlannerSummaryDTO | null>(null);
  const [fin, setFin] = useState<FinanceSummaryDTO | null>(null);

  useEffect(() => {
    void (async () => {
      const [s, f] = await Promise.all([Planner.fetchSummary(), Planner.fetchFinanceSummary()]);
      if (s.success && s.data) setSummary(s.data);
      if (f.success && f.data) setFin(f.data);
    })();
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Planner
          </Link>
          <AuthBar />
        </div>
      </header>

      <main className="flex-1 space-y-12 px-4 py-12 sm:px-6">
        <section className="mx-auto max-w-6xl space-y-3">
          <Badge variant="secondary">Your workspace</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h1>
          <p className="max-w-2xl text-muted-foreground">
            Pick up where you left off. Open a module or review today&apos;s snapshot.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {!summary ? (
            <>
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Tasks done</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">
                    {summary.tasksDone}
                    <span className="text-base font-normal text-muted-foreground">/{summary.tasks}</span>
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>This month</CardDescription>
                  <CardTitle className="text-sm font-normal text-muted-foreground">Cash flow</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {fin ? (
                    <>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">+{fin.monthIncome}</p>
                      <p className="text-sm text-destructive">−{fin.monthSpend}</p>
                    </>
                  ) : (
                    <Skeleton className="h-10 w-full" />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Open debt</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">
                    {fin != null ? String(fin.openDebtCount) : "—"}
                  </CardTitle>
                </CardHeader>
                {fin ? (
                  <CardContent className="pt-0 text-xs text-muted-foreground">
                    Exposure {fin.openDebtExposure}
                    {fin.upcomingDebtDue7d > 0 ? ` · ${fin.upcomingDebtDue7d} due within 7d` : null}
                  </CardContent>
                ) : null}
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Upcoming</CardDescription>
                  <CardTitle className="text-base font-medium">Calendar</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href="/calendar" className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0")}>
                    {summary.calendarEvents} events tracked →
                  </Link>
                </CardContent>
              </Card>
            </>
          )}
        </section>

        <section className="mx-auto max-w-6xl">
          <h2 className="text-lg font-semibold tracking-tight">Modules</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLANNER_MODULES.filter((m) => m.href !== "/dashboard").map((m) => (
              <li key={m.href}>
                <Link href={m.href} className="block h-full">
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base">{m.label}</CardTitle>
                      <CardDescription className="line-clamp-2">{m.keywords}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
              Open overview dashboard
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
