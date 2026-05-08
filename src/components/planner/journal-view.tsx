"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import * as Planner from "@/services/planner.service";
import type { JournalEntryDTO } from "@/types/planner";

export function JournalView() {
  const [entries, setEntries] = useState<JournalEntryDTO[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await Planner.fetchJournal();
    if (res.success && res.data) setEntries(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await Planner.createJournalEntry({ title: title || "Entry", body });
    if (res.success) {
      setTitle("");
      setBody("");
      await load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete entry?")) return;
    const res = await Planner.deleteJournalEntry(id);
    if (res.success) await load();
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-4 max-w-lg" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reflect by day; long-form body with optional mood and tags (via API).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New entry</CardTitle>
          <CardDescription>Title defaults to “Entry” if you leave it blank.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="journal-title">Title</FieldLabel>
              <FieldContent>
                <Input id="journal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="journal-body">Body</FieldLabel>
              <FieldContent>
                <Textarea id="journal-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write freely…" rows={6} />
              </FieldContent>
            </Field>
            <Button type="submit">Save entry</Button>
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-4">
        {entries.map((j) => (
          <li key={j.id}>
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <CardTitle className="text-lg">{j.title || "Untitled"}</CardTitle>
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void remove(j.id)}>
                  Delete
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{j.body}</p>
                <Separator />
                <p className="text-xs text-muted-foreground">{j.entryDate}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
