"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoals } from "@/modules/goals/hooks/use-goals";

export function GoalsView() {
  const { goals, milestones, loading, msg, addGoal, toggleMilestone, addMilestone, removeGoal } = useGoals();
  const [title, setTitle] = useState("");

  async function onAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await addGoal(title.trim());
    setTitle("");
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-4 max-w-lg" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define outcomes, track progress, and break work into milestones.
        </p>
      </header>

      {msg ? (
        <Alert>
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New goal</CardTitle>
          <CardDescription>Start with a clear outcome; milestones come next.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAddGoal} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="goal-title">Title</FieldLabel>
              <FieldContent>
                <Input
                  id="goal-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ship your first milestone…"
                />
              </FieldContent>
            </Field>
            <Button type="submit" className="shrink-0">
              Add goal
            </Button>
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-4">
        {goals.map((g) => (
          <li key={g.id}>
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-lg">{g.title}</CardTitle>
                  <CardDescription>
                    {g.status} · {g.progress}% · target {g.targetDate ?? "—"}
                  </CardDescription>
                </div>
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void removeGoal(g.id)}>
                  Delete
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <Separator />
                <p className="text-xs font-medium text-muted-foreground">Milestones</p>
                <ul className="space-y-2">
                  {(milestones[g.id] ?? []).map((m) => (
                    <li key={m.id} className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={Boolean(m.completedAt)}
                        onCheckedChange={() => void toggleMilestone(g.id, m)}
                        aria-label={`Toggle ${m.title}`}
                        className="mt-0.5"
                      />
                      <span className={m.completedAt ? "text-muted-foreground line-through" : ""}>{m.title}</span>
                      {m.dueDate ? (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{m.dueDate}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <MilestoneQuickAdd onAdd={(t) => void addMilestone(g.id, t)} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goals yet. Add your first one above.</p>
      ) : null}
    </div>
  );
}

function MilestoneQuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(v);
        setV("");
      }}
    >
      <Field className="min-w-0 flex-1">
        <FieldLabel htmlFor="milestone-title">Add milestone</FieldLabel>
        <FieldContent>
          <Input id="milestone-title" value={v} onChange={(e) => setV(e.target.value)} placeholder="Milestone title" />
        </FieldContent>
      </Field>
      <Button type="submit" variant="secondary" size="sm" className="shrink-0">
        Add
      </Button>
    </form>
  );
}
