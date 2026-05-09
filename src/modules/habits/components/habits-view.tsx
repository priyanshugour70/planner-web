"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import * as HabitsApi from "@/modules/habits/client/api";
import type { HabitDTO, HabitEntryDTO } from "@/types/planner";

export function HabitsView() {
  const [habits, setHabits] = useState<HabitDTO[]>([]);
  const [entries, setEntries] = useState<Record<string, HabitEntryDTO[]>>({});
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await HabitsApi.fetchHabits();
    if (res.success && res.data) {
      setHabits(res.data);
      const en: Record<string, HabitEntryDTO[]> = {};
      for (const h of res.data) {
        const er = await HabitsApi.fetchHabitEntries(h.id);
        if (er.success && er.data) en[h.id] = er.data;
      }
      setEntries(en);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await HabitsApi.createHabit({ name: name.trim() });
    if (res.success) {
      setName("");
      await load();
    }
  }

  async function logToday(habitId: string) {
    const d = new Date().toISOString().slice(0, 10);
    const res = await HabitsApi.logHabitEntry(habitId, { entryDate: d, count: 1 });
    if (res.success) await load();
  }

  async function removeHabit(id: string) {
    if (!confirm("Delete habit and its history?")) return;
    const res = await HabitsApi.deleteHabit(id);
    if (res.success) await load();
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 max-w-md" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track streaks with one tap per day. Entries upsert by date.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New habit</CardTitle>
          <CardDescription>Name it something you will recognize at a glance.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="habit-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="habit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Morning run, read 20 pages…"
                />
              </FieldContent>
            </Field>
            <Button type="submit" className="shrink-0">
              Add habit
            </Button>
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-4">
        {habits.map((h) => (
          <li key={h.id}>
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full border" style={{ backgroundColor: h.color }} />
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">{h.name}</CardTitle>
                    <CardDescription>{h.frequency}</CardDescription>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => void logToday(h.id)}>
                    Log today
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void removeHabit(h.id)}>
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Recent: {(entries[h.id] ?? []).slice(0, 7).map((e) => `${e.entryDate}×${e.count}`).join(" · ") || "—"}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {habits.length === 0 ? <p className="text-sm text-muted-foreground">No habits yet.</p> : null}
    </div>
  );
}
