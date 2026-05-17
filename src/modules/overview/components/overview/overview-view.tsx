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
import { useMemo } from "react";
import {
  CheckSquare,
  TrendingUp,
  Flame,
  Award,
  BookOpen,
  FileText,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

export function OverviewView() {
  const { summary: s, financeSummary: fin, monthlyUpdates: updates, loading } = useOverviewDashboard();

  // 1. Calculate most active module
  const mostActiveModule = useMemo(() => {
    if (!updates) return null;
    
    const sums = {
      tasks: 0,
      habits: 0,
      journals: 0,
      notes: 0,
      transactions: 0,
      events: 0
    };

    Object.values(updates).forEach((day) => {
      sums.tasks += day.tasks || 0;
      sums.habits += day.habits || 0;
      sums.journals += day.journals || 0;
      sums.notes += day.notes || 0;
      sums.transactions += day.transactions || 0;
      sums.events += day.events || 0;
    });

    const entries = Object.entries(sums);
    let maxKey = "tasks";
    let maxVal = 0;
    entries.forEach(([k, v]) => {
      if (v > maxVal) {
        maxVal = v;
        maxKey = k;
      }
    });

    if (maxVal === 0) return null;

    const labels: Record<string, { title: string; desc: string; icon: any; color: string }> = {
      tasks: { title: "Task Manager", desc: "You are crushing your goals and checking off deliverables!", icon: CheckSquare, color: "text-emerald-500" },
      habits: { title: "Habit Tracker", desc: "You are building unstoppable daily streaks and discipline!", icon: Flame, color: "text-rose-500" },
      journals: { title: "Mindfulness Journal", desc: "You are focusing heavily on self-reflection and mental clarity!", icon: BookOpen, color: "text-blue-500" },
      notes: { title: "Knowledge Notebook", desc: "You are capturing thoughts and writing extensive ideas!", icon: FileText, color: "text-amber-500" },
      transactions: { title: "Finance Budgeting", desc: "You are maintaining supreme awareness of cashflows and expenses!", icon: TrendingUp, color: "text-cyan-500" },
      events: { title: "Calendar Scheduler", desc: "You are packing your days with high-value meetings and events!", icon: Calendar, color: "text-purple-500" }
    };

    return {
      key: maxKey,
      count: maxVal,
      ...labels[maxKey]
    };
  }, [updates]);

  // 2. Generate contribution grid days (current month)
  const currentMonthDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        dayNum: i,
        dateStr,
        activity: updates?.[dateStr]?.total || 0
      });
    }
    return days;
  }, [updates]);

  if (loading) {
    return (
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
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
      <div className="p-6 text-center max-w-md mx-auto">
        <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-bold">Workspace Unavailable</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Unable to load workspace summary. Check your connection and try again.
        </p>
      </div>
    );
  }

  const taskProgress = s.tasks > 0 ? Math.round((s.tasksDone / s.tasks) * 100) : 0;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Premium Dashboard Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Overview Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A comprehensive, human-centric visual index of your {PRODUCT_NAME} workspace activity.
          </p>
        </div>
        <div className="text-xs text-muted-foreground font-medium bg-muted/40 px-3 py-1.5 rounded-full self-start md:self-center border border-border">
          Active Profile: <span className="text-foreground font-bold">priyanshugour1@gmail.com</span>
        </div>
      </header>

      {/* Primary Highlights Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* 1. Tasks Completion Progress */}
        <Card className="shadow-md border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-wider font-semibold text-xs text-muted-foreground">
              Deliverables Progress
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-baseline gap-1">
              {s.tasksDone}
              <span className="text-lg font-medium text-muted-foreground">/{s.tasks}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              You completed <span className="text-emerald-500 font-bold">{taskProgress}%</span> of your scheduled tasks.
            </p>
          </CardContent>
        </Card>

        {/* 2. Finance Health Ratio */}
        <Card className="shadow-md border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-wider font-semibold text-xs text-muted-foreground">
              Cashflow Balance (MTD)
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">
              {formatInrAmount(Number(s.totalIncome) - Number(s.totalExpense))}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-1 text-sm font-medium">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Income: {formatInrAmount(s.totalIncome)}</span>
              <span>Expenses: {formatInrAmount(s.totalExpense)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-2.5 transition-all"
                style={{ width: `${Number(s.totalIncome) > 0 ? (Number(s.totalIncome) / (Number(s.totalIncome) + Number(s.totalExpense))) * 100 : 50}%` }}
              />
              <div
                className="bg-rose-500 h-2.5 transition-all"
                style={{ width: `${Number(s.totalExpense) > 0 ? (Number(s.totalExpense) / (Number(s.totalIncome) + Number(s.totalExpense))) * 100 : 50}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Most Active Module Highlight Card */}
        {mostActiveModule ? (
          <Card className="shadow-md border-border bg-gradient-to-br from-card/80 to-accent/5 relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-15">
              <Award className="h-20 w-20 text-accent" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="uppercase tracking-wider font-semibold text-xs text-muted-foreground flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" /> Focus Spotlight
              </CardDescription>
              <CardTitle className={cn("text-xl font-extrabold flex items-center gap-2", mostActiveModule.color)}>
                <mostActiveModule.icon className="h-5 w-5 shrink-0" />
                {mostActiveModule.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {mostActiveModule.desc}
              </p>
              <div className="mt-3 text-xs font-semibold text-muted-foreground">
                Total logs this month: <span className="text-foreground font-bold">{mostActiveModule.count} updates</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md border-border bg-card/60 backdrop-blur-sm flex items-center justify-center p-6 text-center border-dashed">
            <div>
              <Layers className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <CardTitle className="text-sm font-semibold">No Month-to-Date Activity</CardTitle>
              <CardDescription className="text-xs mt-1">
                Start tracking habits, checking tasks, or logging entries to reveal focus metrics.
              </CardDescription>
            </div>
          </Card>
        )}
      </div>

      {/* GitHub-Style Contribution Heatmap */}
      <Card className="shadow-md border-border bg-card/60 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Continuous Engagement
          </CardTitle>
          <CardDescription>
            Visual map of daily aggregated planner updates for the current month
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2 justify-start sm:grid sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-16">
            {currentMonthDays.map((day) => {
              // Activity intensity coloring
              const count = day.activity;
              let intensity = "bg-muted/20 text-muted-foreground/60 border border-muted/30 hover:border-muted-foreground/20";
              if (count > 0 && count <= 2) intensity = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20";
              if (count > 2 && count <= 5) intensity = "bg-emerald-500/30 text-emerald-600 border border-emerald-500/40 hover:bg-emerald-500/40";
              if (count > 5) intensity = "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20";

              return (
                <div
                  key={day.dayNum}
                  title={`${new Date(day.dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${count} updates`}
                  className={cn(
                    "h-10 w-10 flex flex-col items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-all hover:scale-105",
                    intensity
                  )}
                >
                  <span>{day.dayNum}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Less activity</span>
            <div className="h-3 w-3 rounded bg-muted/20 border border-muted" />
            <div className="h-3 w-3 rounded bg-emerald-500/25 border border-emerald-500/20" />
            <div className="h-3 w-3 rounded bg-emerald-500/60 border border-emerald-500/45" />
            <div className="h-3 w-3 rounded bg-emerald-500" />
            <span>More activity</span>
          </div>
        </CardContent>
      </Card>

      {/* Finance Health (If present) */}
      {fin && (
        <Card className="shadow-md border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base font-bold">Financial Standing & Balances</CardTitle>
            <CardDescription>Open obligations and monthly exposure metrics</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 pt-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Month-to-Date Spend</span>
              <p className="font-semibold text-rose-500 text-lg mt-0.5">−{formatInrAmount(fin.monthSpend)}</p>
            </div>
            <div className="border-r border-border shrink-0 my-1 hidden sm:block" />
            <div>
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Month-to-Date Income</span>
              <p className="font-semibold text-emerald-500 text-lg mt-0.5">+{formatInrAmount(fin.monthIncome)}</p>
            </div>
            <div className="border-r border-border shrink-0 my-1 hidden sm:block" />
            <div>
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Debt Counterparties</span>
              <p className="font-semibold text-foreground text-lg mt-0.5">{fin.openDebtCount} Active</p>
              <p className="text-xs text-muted-foreground">Exposure {formatInrAmount(fin.openDebtExposure)}</p>
            </div>
            <Link
              href="/finance"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "ml-auto self-center gap-1.5"
              )}
            >
              Open Finance <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Interactive Navigation Launcher Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Workspace Quick Launchpad
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/goals", label: "Goals", key: "goals" as const, desc: "Objectives & key milestones", color: "hover:border-primary/45" },
            { href: "/tasks", label: "Tasks", key: "tasks" as const, desc: "Checklists & task statuses", color: "hover:border-emerald-500/40" },
            { href: "/finance", label: "Finance", key: "transactions" as const, desc: "Ledgers, wallets & budgets", color: "hover:border-cyan-500/40" },
            { href: "/habits", label: "Habits", key: "habits" as const, desc: "Streaks & daily tracking", color: "hover:border-rose-500/40" },
            { href: "/journal", label: "Journal", key: "journalEntries" as const, desc: "Reflections & moods logging", color: "hover:border-blue-500/40" },
            { href: "/notes", label: "Notes", key: "notes" as const, desc: "Brain dumps, files & drafts", color: "hover:border-amber-500/40" },
            { href: "/calendar", label: "Calendar", key: "calendarEvents" as const, desc: "Events scheduler & month-view", color: "hover:border-purple-500/40" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-between items-center gap-4 py-4 px-5 font-semibold text-sm border-border bg-card/40 transition-all hover:bg-muted/30 hover:scale-[1.01] shadow-sm",
                l.color
              )}
            >
              <div className="text-left">
                <span className="font-bold text-foreground text-sm block">{l.label}</span>
                <span className="font-normal text-xs text-muted-foreground mt-0.5 block">{l.desc}</span>
              </div>
              <Badge variant="secondary" className="tabular-nums font-bold px-2.5 py-1 text-xs shrink-0 bg-muted/60">
                {s[l.key]}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
