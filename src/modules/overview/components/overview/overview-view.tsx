"use client";

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
import { useOverviewDashboard } from "@/modules/overview/hooks/use-overview-dashboard";
import { cn } from "@/lib/utils";
import { formatInrAmount } from "@/lib/format-inr";
import { PRODUCT_NAME } from "@/lib/product";

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
  const { summary: s, financeSummary: fin, loading } = useOverviewDashboard();

  if (loading) {
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

  if (!s) {
    return (
      <p className="text-sm text-muted-foreground">
        Unable to load workspace summary. Check your connection and try again.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-module snapshot for your {PRODUCT_NAME} workspace. Use the launcher (bottom-right) or ⌘K to jump
          anywhere.
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
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">+{formatInrAmount(s.totalIncome)}</p>
            <p className="text-sm font-medium text-destructive">−{formatInrAmount(s.totalExpense)}</p>
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
      {fin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Finance health</CardTitle>
            <CardDescription>This month and open obligations.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">MTD spend</span>
              <p className="font-semibold text-destructive">−{formatInrAmount(fin.monthSpend)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">MTD income</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatInrAmount(fin.monthIncome)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Open debt</span>
              <p className="font-semibold">{fin.openDebtCount}</p>
              <p className="text-xs text-muted-foreground">Exposure {formatInrAmount(fin.openDebtExposure)}</p>
            </div>
            <Link href="/finance" className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto self-center p-0")}>
              Open finance →
            </Link>
          </CardContent>
        </Card>
      ) : null}
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
