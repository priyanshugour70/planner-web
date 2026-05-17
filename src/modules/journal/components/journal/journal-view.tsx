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
  BookOpen, Flame, Heart, HeartOff, Lightbulb, PenLine, Plus, Search, Sparkles,
  Star, Trash2, TrendingUp,
} from "lucide-react";
import { useJournal } from "@/modules/journal/hooks/use-journal";
import type { JournalTab } from "@/modules/journal/stores/journal-store";
import { useJournalStore } from "@/modules/journal/stores/journal-store";
import { cn } from "@/lib/utils";
import type { JournalEntryDTO } from "@/types/planner";

const MOOD_EMOJI: Record<string, string> = {
  amazing: "🤩", good: "😊", neutral: "😐", bad: "😞", terrible: "😢",
};
const MOOD_LABELS: Record<string, string> = {
  amazing: "Amazing", good: "Good", neutral: "Neutral", bad: "Bad", terrible: "Terrible",
};
const MOOD_COLORS: Record<string, string> = {
  amazing: "text-amber-500", good: "text-emerald-500", neutral: "text-blue-400",
  bad: "text-orange-500", terrible: "text-rose-500",
};

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: React.ReactNode; sub?: React.ReactNode;
  accent?: "default" | "emerald" | "rose" | "amber" | "violet";
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5",
      accent === "emerald" && "border-emerald-500/20 bg-emerald-500/[0.07]",
      accent === "rose" && "border-rose-500/20 bg-rose-500/[0.07]",
      accent === "amber" && "border-amber-500/25 bg-amber-500/[0.08]",
      accent === "violet" && "border-violet-500/20 bg-violet-500/[0.07]",
      (!accent || accent === "default") && "border-border/70 bg-card/95 backdrop-blur-sm",
    )}>
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
        <div className="shrink-0 rounded-xl border border-border/50 bg-muted/40 p-2.5">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function MoodBar({ data }: { data: { mood: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <p className="text-sm text-muted-foreground">No mood data yet.</p>;
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.mood} className="flex items-center gap-3">
          <span className="w-6 text-center">{MOOD_EMOJI[d.mood] ?? "❓"}</span>
          <span className="w-20 text-xs font-medium">{MOOD_LABELS[d.mood] ?? d.mood}</span>
          <div className="flex-1">
            <div className="h-3 overflow-hidden rounded-full bg-muted/60">
              <div
                className={cn("h-full rounded-full transition-all",
                  d.mood === "amazing" && "bg-amber-400", d.mood === "good" && "bg-emerald-400",
                  d.mood === "neutral" && "bg-blue-400", d.mood === "bad" && "bg-orange-400",
                  d.mood === "terrible" && "bg-rose-400",
                )}
                style={{ width: `${Math.round((d.count / total) * 100)}%` }}
              />
            </div>
          </div>
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

export function JournalView() {
  const {
    entries, analytics, loading, tab, moodFilter, search, promptOfTheDay,
    setTab, setMoodFilter, setSearch, createEntry, updateEntry, toggleFavorite,
    removeEntry, requestQuickCreate,
  } = useJournal();

  const quickCreateRequest = useJournalStore((s) => s.quickCreateRequest);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntryDTO | null>(null);

  // Create form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");
  const [energyLevel, setEnergyLevel] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));

  // Edit form
  const [eTitle, setETitle] = useState("");
  const [eBody, setEBody] = useState("");
  const [eMood, setEMood] = useState("");
  const [eTags, setETags] = useState("");
  const [eEnergyLevel, setEEnergyLevel] = useState("");

  const filtered = useMemo(() => {
    let list = entries;
    if (tab === "favorites") list = list.filter((e) => e.isFavorite);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) => e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [entries, tab, search]);

  useEffect(() => {
    if (quickCreateRequest === 0) return;
    setCreateOpen(true);
  }, [quickCreateRequest]);

  function openEdit(e: JournalEntryDTO) {
    setEditing(e); setETitle(e.title); setEBody(e.body);
    setEMood(e.mood ?? ""); setETags(e.tags.join(", "));
    setEEnergyLevel(e.energyLevel ? String(e.energyLevel) : "");
    setEditOpen(true);
  }

  async function onCreate(ev: React.FormEvent) {
    ev.preventDefault();
    const input: Record<string, unknown> = {
      title: title.trim(), body: body.trim(), entryDate,
    };
    if (mood) input.mood = mood;
    if (tags.trim()) input.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (energyLevel) input.energyLevel = Number(energyLevel);
    const ok = await createEntry(input);
    if (ok) {
      setTitle(""); setBody(""); setMood(""); setTags("");
      setEnergyLevel(""); setEntryDate(new Date().toISOString().slice(0, 10));
      setCreateOpen(false);
    }
  }

  async function onSaveEdit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editing) return;
    const input: Record<string, unknown> = {
      title: eTitle.trim(), body: eBody.trim(),
    };
    if (eMood) input.mood = eMood; else input.mood = null;
    if (eTags.trim()) input.tags = eTags.split(",").map((t) => t.trim()).filter(Boolean);
    else input.tags = [];
    if (eEnergyLevel) input.energyLevel = Number(eEnergyLevel); else input.energyLevel = null;
    const ok = await updateEntry(editing.id, input);
    if (ok) setEditOpen(false);
  }

  if (loading && entries.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-3 pb-40 sm:px-5 lg:px-6">
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-8 px-3 pb-40 sm:px-5 sm:pb-44 lg:px-6">
      <div className="pointer-events-none fixed inset-x-0 top-20 -z-10 mx-auto h-[22rem] max-w-3xl rounded-[3rem] bg-violet-500/[0.06] blur-3xl" aria-hidden />

      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <PenLine className="size-3.5 shrink-0 text-violet-500" /> Journal
            </div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Capture your thoughts</h1>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Write freely, track your mood, and reflect on your journey. Every entry builds your personal story.
            </p>
            {promptOfTheDay ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-300/30 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-900/10">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <p className="text-sm italic text-amber-800 dark:text-amber-300">&ldquo;{promptOfTheDay}&rdquo;</p>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center justify-center rounded-2xl border border-dashed border-violet-400/25 bg-violet-500/5 p-6 lg:p-8">
            <BookOpen className="size-12 text-violet-500/90 sm:size-14" />
          </div>
        </div>
      </header>

      {/* Stats */}
      {analytics ? (
        <section className="space-y-3">
          <h2 className="px-0.5 text-sm font-semibold tracking-tight">Your writing stats</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={BookOpen} label="Total entries" value={analytics.totalEntries} sub={`${analytics.favoriteCount} favorited`} accent="violet" />
            <StatCard icon={PenLine} label="Words written" value={analytics.totalWords.toLocaleString()} sub={`~${analytics.avgWordsPerEntry} per entry`} accent="emerald" />
            <StatCard icon={Flame} label="Writing streak" value={<span className="text-amber-600 dark:text-amber-400">{analytics.currentWritingStreak}d</span>} sub={`Best: ${analytics.longestWritingStreak}d`} accent="amber" />
            <StatCard icon={TrendingUp} label="This month" value={analytics.entriesPerMonth.at(-1)?.count ?? 0} sub="entries" />
          </div>
        </section>
      ) : null}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as JournalTab)} className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <ScrollArea className="w-full pb-1 sm:w-auto sm:pb-0">
            <TabsList className="inline-flex h-auto min-h-11 w-max gap-1 rounded-2xl border border-border/60 bg-muted/35 p-1.5">
              <TabsTrigger value="entries" className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
                <BookOpen className="size-3.5 opacity-70" /> Entries
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
                <Star className="size-3.5 opacity-70" /> Favorites
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm">
                <Sparkles className="size-3.5 opacity-70" /> Analytics
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Filters */}
          {tab !== "analytics" && (
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-44 pl-8 text-sm"
                />
              </div>
              <Select value={moodFilter || "__all__"} onValueChange={(v) => setMoodFilter(v === "__all__" ? "" : v as any)}>
                <SelectTrigger className="h-9 w-32 text-sm"><SelectValue placeholder="Mood" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All moods</SelectItem>
                  {Object.entries(MOOD_EMOJI).map(([k, emoji]) => (
                    <SelectItem key={k} value={k}>{emoji} {MOOD_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ENTRIES / FAVORITES */}
        {(["entries", "favorites"] as const).map((t) => (
          <TabsContent key={t} value={t} className="mt-6 space-y-4">
            {filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  {t === "favorites" ? "No favorite entries yet. Heart an entry to save it here." : "No journal entries yet. Start writing!"}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((e) => (
                  <Card key={e.id} className="group overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {e.mood && <span className={cn("text-lg", MOOD_COLORS[e.mood])}>{MOOD_EMOJI[e.mood]}</span>}
                          <CardTitle className="truncate text-base">{e.title || "Untitled"}</CardTitle>
                        </div>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                          <span>{e.entryDate}</span>
                          <span>·</span>
                          <span>{e.wordCount} words</span>
                          {e.energyLevel && <><span>·</span><span>Energy: {e.energyLevel}/5</span></>}
                        </CardDescription>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => void toggleFavorite(e.id)} className="touch-manipulation">
                          {e.isFavorite ? <Heart className="size-4 fill-rose-500 text-rose-500" /> : <HeartOff className="size-4" />}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(e)} className="touch-manipulation">Edit</Button>
                        <Button type="button" variant="ghost" size="sm" className="touch-manipulation text-destructive" onClick={() => { if (confirm("Delete this entry?")) void removeEntry(e.id); }}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{e.body}</p>
                      {e.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {e.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {analytics ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mood distribution</CardTitle>
                  <CardDescription>How you&apos;ve been feeling</CardDescription>
                </CardHeader>
                <CardContent>
                  <MoodBar data={analytics.moodDistribution} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly activity</CardTitle>
                  <CardDescription>Entries per month (last 12)</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.entriesPerMonth.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {analytics.entriesPerMonth.map((m) => (
                        <div key={m.month} className="flex items-center gap-3">
                          <span className="w-16 text-xs font-medium text-muted-foreground">{m.month}</span>
                          <div className="flex-1">
                            <div className="h-3 overflow-hidden rounded-full bg-muted/60">
                              <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${Math.min(100, (m.count / Math.max(...analytics.entriesPerMonth.map((x) => x.count), 1)) * 100)}%` }} />
                            </div>
                          </div>
                          <span className="w-8 text-right text-xs tabular-nums">{m.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading analytics…</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto" showCloseButton>
          <DialogHeader>
            <DialogTitle>New journal entry</DialogTitle>
            <DialogDescription>Write freely — there are no wrong answers.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(ev) => void onCreate(ev)} className="grid gap-3">
            <Field><FieldLabel>Title</FieldLabel><FieldContent><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Today's reflection…" /></FieldContent></Field>
            <Field><FieldLabel>Body</FieldLabel><FieldContent><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="What's on your mind?" /></FieldContent></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel>Mood</FieldLabel><FieldContent>
                <Select value={mood || "__none__"} onValueChange={(v) => setMood(v === "__none__" ? "" : (v ?? ""))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="How are you?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {Object.entries(MOOD_EMOJI).map(([k, emoji]) => (
                      <SelectItem key={k} value={k}>{emoji} {MOOD_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent></Field>
              <Field><FieldLabel>Date</FieldLabel><FieldContent><Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} /></FieldContent></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel>Tags</FieldLabel><FieldContent><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="work, health, ideas" /></FieldContent></Field>
              <Field><FieldLabel>Energy (1-5)</FieldLabel><FieldContent><Input type="number" min="1" max="5" value={energyLevel} onChange={(e) => setEnergyLevel(e.target.value)} placeholder="1-5" /></FieldContent></Field>
            </div>
            <DialogFooter><Button type="submit">Save entry</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit entry</DialogTitle>
            <DialogDescription>Update your reflection.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(ev) => void onSaveEdit(ev)} className="grid gap-3">
            <Field><FieldLabel>Title</FieldLabel><FieldContent><Input value={eTitle} onChange={(e) => setETitle(e.target.value)} /></FieldContent></Field>
            <Field><FieldLabel>Body</FieldLabel><FieldContent><Textarea value={eBody} onChange={(e) => setEBody(e.target.value)} rows={6} /></FieldContent></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field><FieldLabel>Mood</FieldLabel><FieldContent>
                <Select value={eMood || "__none__"} onValueChange={(v) => setEMood(v === "__none__" ? "" : (v ?? ""))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {Object.entries(MOOD_EMOJI).map(([k, emoji]) => (
                      <SelectItem key={k} value={k}>{emoji} {MOOD_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent></Field>
              <Field><FieldLabel>Energy (1-5)</FieldLabel><FieldContent><Input type="number" min="1" max="5" value={eEnergyLevel} onChange={(e) => setEEnergyLevel(e.target.value)} /></FieldContent></Field>
            </div>
            <Field><FieldLabel>Tags</FieldLabel><FieldContent><Input value={eTags} onChange={(e) => setETags(e.target.value)} placeholder="comma-separated" /></FieldContent></Field>
            <DialogFooter><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* FAB */}
      <Button
        type="button" size="icon"
        className="fixed z-50 h-14 w-14 rounded-full shadow-lg touch-manipulation right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[calc(max(1rem,env(safe-area-inset-bottom,0px))+3rem+0.75rem)] md:right-6 md:bottom-[calc(1.5rem+3rem+0.75rem)]"
        aria-label="New entry" onClick={() => requestQuickCreate()}
      >
        <Plus className="size-7" />
      </Button>
    </div>
  );
}
