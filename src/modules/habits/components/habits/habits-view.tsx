"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useHabits } from "@/modules/habits/hooks/use-habits";

export function HabitsView() {
  const { habits, entries, loading, addHabit, logToday, removeHabit } = useHabits();
  const [name, setName] = useState("");

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await addHabit(name.trim());
    setName("");
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
          <form onSubmit={onAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
