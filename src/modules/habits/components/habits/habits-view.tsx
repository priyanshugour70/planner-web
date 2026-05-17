"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Archive, ArchiveRestore, ChevronDown, ChevronUp, Flame, Plus, Sparkles, Target, Trash2, Trophy, Zap,
} from "lucide-react";
import { useHabits } from "@/modules/habits/hooks/use-habits";
import type { HabitsTab } from "@/modules/habits/stores/habits-store";
import { useHabitsStore } from "@/modules/habits/stores/habits-store";
import { cn } from "@/lib/utils";
import type { HabitDTO } from "@/types/planner";

const NONE = "__none__";

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string; value: React.ReactNode; sub?: React.ReactNode;
  accent?: "default" | "emerald" | "rose" | "amber" | "violet";
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5",
      accent === "emerald" && "border-emerald-500/20 bg-emerald-500/[0.07] dark:border-emerald-500/25 dark:bg-emerald-500/[0.1]",
      accent === "rose" && "border-rose-500/20 bg-rose-500/[0.07] dark:border-rose-500/25 dark:bg-rose-500/[0.1]",
      accent === "amber" && "border-amber-500/25 bg-amber-500/[0.08] dark:border-amber-500/30 dark:bg-amber-500/[0.11]",
      accent === "violet" && "border-violet-500/20 bg-violet-500/[0.07] dark:border-violet-500/25 dark:bg-violet-500/[0.1]",
      (!accent || accent === "default") && "border-border/70 bg-card/95 backdrop-blur-sm",
    )}>
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br from-primary/[0.07] to-transparent" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</div>
          {sub ? <div className="text-xs leading-snug text-muted-foreground">{sub}</div> : null}
        </div>
        <div className="shrink-0 rounded-xl border border-border/50 bg-muted/40 p-2.5">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function HeatmapRow({ habitId, entries }: { habitId: string; entries: { entryDate: string | null; count: number }[] }) {
  const today = new Date();
  const cells: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const entry = entries.find((e) => e.entryDate === ds);
    cells.push({ date: ds, count: entry?.count ?? 0 });
  }
  return (
    <div className="flex items-center gap-0.5">
      {cells.map((c) => (
        <div
          key={c.date}
          title={`${c.date}: ${c.count}`}
          className={cn(
            "size-3 rounded-[3px] transition-colors sm:size-3.5",
            c.count === 0 && "bg-muted/60",
            c.count === 1 && "bg-emerald-400/70 dark:bg-emerald-500/60",
            c.count >= 2 && "bg-emerald-600 dark:bg-emerald-400",
          )}
        />
      ))}
    </div>
  );
}

export function HabitsView() {
  const {
    habits, entries, analytics, summary, loading, tab, search,
    setTab, setSearch, createHabit, updateHabit, archiveHabit, unarchiveHabit,
    removeHabit, logEntry, removeEntry, loadArchived, requestQuickCreate,
  } = useHabits();

  const quickCreateRequest = useHabitsStore((s) => s.quickCreateRequest);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<HabitDTO | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("🎯");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">("daily");
  const [targetPerWeek, setTargetPerWeek] = useState("7");

  // Edit form
  const [eName, setEName] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eColor, setEColor] = useState("#6366f1");
  const [eIcon, setEIcon] = useState("🎯");
  const [eFrequency, setEFrequency] = useState<"daily" | "weekly" | "custom">("daily");
  const [eTargetPerWeek, setETargetPerWeek] = useState("7");

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => h.archived), [habits]);

  const filtered = useMemo(() => {
    const list = tab === "archived" ? archivedHabits : activeHabits;
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((h) => h.name.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q));
  }, [tab, activeHabits, archivedHabits, search]);

  useEffect(() => {
    if (tab === "archived") void loadArchived();
  }, [tab, loadArchived]);

  useEffect(() => {
    if (quickCreateRequest === 0) return;
    setCreateOpen(true);
  }, [quickCreateRequest]);

  function openEdit(h: HabitDTO) {
    setEditing(h); setEName(h.name); setEDescription(h.description ?? "");
    setEColor(h.color); setEIcon(h.icon); setEFrequency(h.frequency as "daily" | "weekly" | "custom");
    setETargetPerWeek(String(h.targetPerWeek ?? 7)); setEditOpen(true);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const ok = await createHabit({
      name: name.trim(), description: description.trim() || null,
      color, icon, frequency, targetPerWeek: Number(targetPerWeek) || 7,
    });
    if (ok) { setName(""); setDescription(""); setColor("#6366f1"); setIcon("🎯"); setFrequency("daily"); setTargetPerWeek("7"); setCreateOpen(false); }
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const ok = await updateHabit(editing.id, {
      name: eName.trim(), description: eDescription.trim() || null,
      color: eColor, icon: eIcon, frequency: eFrequency, targetPerWeek: Number(eTargetPerWeek) || 7,
    });
    if (ok) setEditOpen(false);
  }

  async function onLogToday(habitId: string) {
    const d = new Date().toISOString().slice(0, 10);
    await logEntry(habitId, d, 1);
  }

  if (loading && habits.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-3 pb-40 sm:px-5 lg:px-6">
        <div className="space-y-3 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-8">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-10 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="relative mx-auto max-w-6xl space-y-8 px-3 pb-40 sm:px-5 sm:pb-44 lg:px-6">
      <div className="pointer-events-none fixed inset-x-0 top-20 -z-10 mx-auto h-[22rem] max-w-3xl rounded-[3rem] bg-primary/[0.06] blur-3xl dark:bg-primary/[0.09]" aria-hidden />

      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Flame className="size-3.5 shrink-0 text-orange-500" aria-hidden />
              Habit tracker
            </div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Build consistency, one day at a time</h1>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Track streaks, log daily progress, and watch your habits grow. Entries upsert by date — tap once to log today.
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-6 lg:p-8">
            <Target className="size-12 text-primary/90 sm:size-14" aria-hidden />
          </div>
        </div>
      </header>

      {/* Stats */}
      {summary ? (
        <section aria-labelledby="habits-snapshot" className="space-y-3">
          <h2 id="habits-snapshot" className="px-0.5 text-sm font-semibold tracking-tight">Live snapshot</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Target} label="Active habits" value={summary.activeHabits} sub={`${summary.archivedHabits} archived`} accent="violet" />
            <StatCard icon={Zap} label="Logged today" value={summary.todayLogged} sub={`of ${summary.activeHabits} active`} accent="emerald" />
            <StatCard icon={Flame} label="Active streaks" value={summary.totalStreaksActive} sub="Habits with a running streak" accent="amber" />
            <StatCard icon={Trophy} label="Best streak" value={<span className="text-amber-600 dark:text-amber-400">{summary.bestCurrentStreak} days</span>} sub="Current best across all habits" />
          </div>
        </section>
      ) : null}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as HabitsTab)} className="space-y-6">
        <ScrollArea className="w-full pb-1 sm:pb-0">
          <TabsList className="inline-flex h-auto min-h-11 w-max max-w-full flex-wrap gap-1 rounded-2xl border border-border/60 bg-muted/35 p-1.5 sm:flex-nowrap">
            <TabsTrigger value="overview" className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <Sparkles className="size-3.5 opacity-70" aria-hidden /> Overview
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <Target className="size-3.5 opacity-70" aria-hidden /> All habits
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
              <Archive className="size-3.5 opacity-70" aria-hidden /> Archived
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {activeHabits.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">No active habits yet. Create one to get started!</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {activeHabits.map((h) => {
                const a = analytics[h.id];
                const todayLogged = (entries[h.id] ?? []).some((e) => e.entryDate === todayStr);
                return (
                  <Card key={h.id} className="overflow-hidden border-border/70 shadow-sm">
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: h.color + "22" }}>{h.icon}</span>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-lg">{h.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            {h.frequency} {h.targetPerWeek ? `· ${h.targetPerWeek}×/week` : ""}
                            {a && a.currentStreak > 0 ? (
                              <Badge variant="secondary" className="gap-1 text-[10px]">
                                <Flame className="size-3 text-orange-500" aria-hidden /> {a.currentStreak}d streak
                              </Badge>
                            ) : null}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button type="button" size="sm" variant={todayLogged ? "secondary" : "default"} className="touch-manipulation" onClick={() => void onLogToday(h.id)}>
                          {todayLogged ? "✓ Logged" : "Log today"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="touch-manipulation" onClick={() => openEdit(h)}>Edit</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <HeatmapRow habitId={h.id} entries={entries[h.id] ?? []} />
                      {a ? (
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>Longest: <strong className="text-foreground">{a.longestStreak}d</strong></span>
                          <span>Total logs: <strong className="text-foreground">{a.totalEntries}</strong></span>
                          <span>30d rate: <strong className="text-foreground">{a.completionRate}%</strong></span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ALL / ARCHIVED TAB */}
        {(["all", "archived"] as const).map((t) => (
          <TabsContent key={t} value={t} className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field className="min-w-0 flex-1">
                <FieldLabel htmlFor={`${t}-search`}>Search</FieldLabel>
                <FieldContent>
                  <Input id={`${t}-search`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by name…" />
                </FieldContent>
              </Field>
            </div>
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t === "archived" ? "Archived" : "Active"} habits</CardTitle>
                <CardDescription>{filtered.length} shown</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[min(38rem,65vh)] w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12" />
                        <TableHead>Habit</TableHead>
                        <TableHead className="hidden w-24 md:table-cell">Freq</TableHead>
                        <TableHead className="hidden w-24 lg:table-cell">Streak</TableHead>
                        <TableHead className="w-36 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No habits found.</TableCell></TableRow>
                      ) : filtered.map((h) => {
                        const a = analytics[h.id];
                        return (
                          <TableRow key={h.id}>
                            <TableCell>
                              <span className="flex size-8 items-center justify-center rounded-lg text-sm" style={{ backgroundColor: h.color + "22" }}>{h.icon}</span>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{h.name}</p>
                              {h.description ? <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{h.description}</p> : null}
                            </TableCell>
                            <TableCell className="hidden text-muted-foreground md:table-cell">{h.frequency}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {a ? <Badge variant="secondary" className="text-[10px]">{a.currentStreak}d</Badge> : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {t === "archived" ? (
                                  <Button type="button" variant="outline" size="sm" className="touch-manipulation" onClick={() => void unarchiveHabit(h.id)}>
                                    <ArchiveRestore className="mr-1 size-3" /> Restore
                                  </Button>
                                ) : (
                                  <>
                                    <Button type="button" variant="outline" size="sm" className="touch-manipulation" onClick={() => openEdit(h)}>Edit</Button>
                                    <Button type="button" variant="ghost" size="sm" className="touch-manipulation" onClick={() => void archiveHabit(h.id)}>
                                      <Archive className="size-3" />
                                    </Button>
                                  </>
                                )}
                                <Button type="button" variant="ghost" size="sm" className="touch-manipulation text-destructive" onClick={() => { if (confirm("Delete this habit and all its history?")) void removeHabit(h.id); }}>
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto" showCloseButton>
          <DialogHeader>
            <DialogTitle>New habit</DialogTitle>
            <DialogDescription>Name it something you will recognize at a glance.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void onCreate(e)} className="grid gap-3">
            <Field><FieldLabel htmlFor="h-name">Name</FieldLabel><FieldContent><Input id="h-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Morning run, read 20 pages…" required /></FieldContent></Field>
            <Field><FieldLabel>Description</FieldLabel><FieldContent><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional details…" /></FieldContent></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel htmlFor="h-icon">Icon</FieldLabel><FieldContent><Input id="h-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🎯" /></FieldContent></Field>
              <Field><FieldLabel htmlFor="h-color">Color</FieldLabel><FieldContent><Input id="h-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} /></FieldContent></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel>Frequency</FieldLabel><FieldContent>
                <Select value={frequency} onValueChange={(v) => setFrequency((v ?? "daily") as "daily" | "weekly" | "custom")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent>
                </Select>
              </FieldContent></Field>
              <Field><FieldLabel htmlFor="h-target">Target / week</FieldLabel><FieldContent><Input id="h-target" type="number" min="1" max="21" value={targetPerWeek} onChange={(e) => setTargetPerWeek(e.target.value)} /></FieldContent></Field>
            </div>
            <DialogFooter><Button type="submit" className="touch-manipulation">Create habit</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
            <DialogDescription>Changes sync across all your devices.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void onSaveEdit(e)} className="grid gap-3">
            <Field><FieldLabel>Name</FieldLabel><FieldContent><Input value={eName} onChange={(e) => setEName(e.target.value)} required /></FieldContent></Field>
            <Field><FieldLabel>Description</FieldLabel><FieldContent><Textarea value={eDescription} onChange={(e) => setEDescription(e.target.value)} rows={2} /></FieldContent></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel>Icon</FieldLabel><FieldContent><Input value={eIcon} onChange={(e) => setEIcon(e.target.value)} /></FieldContent></Field>
              <Field><FieldLabel>Color</FieldLabel><FieldContent><Input type="color" value={eColor} onChange={(e) => setEColor(e.target.value)} /></FieldContent></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel>Frequency</FieldLabel><FieldContent>
                <Select value={eFrequency} onValueChange={(v) => setEFrequency((v ?? "daily") as "daily" | "weekly" | "custom")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent>
                </Select>
              </FieldContent></Field>
              <Field><FieldLabel>Target / week</FieldLabel><FieldContent><Input type="number" min="1" max="21" value={eTargetPerWeek} onChange={(e) => setETargetPerWeek(e.target.value)} /></FieldContent></Field>
            </div>
            <DialogFooter><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* FAB */}
      <Button
        type="button" size="icon"
        className="fixed z-50 h-14 w-14 rounded-full shadow-lg touch-manipulation right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[calc(max(1rem,env(safe-area-inset-bottom,0px))+3rem+0.75rem)] md:right-6 md:bottom-[calc(1.5rem+3rem+0.75rem)]"
        aria-label="New habit" onClick={() => requestQuickCreate()}
      >
        <Plus className="size-7" aria-hidden />
      </Button>
    </div>
  );
}
