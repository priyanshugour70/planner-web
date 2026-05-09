"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import * as NotesApi from "@/modules/notes/client/api";
import type { NoteDTO } from "@/types/planner";

export function NotesView() {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await NotesApi.fetchNotes();
    if (res.success && res.data) setNotes(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await NotesApi.createNote({ title: title.trim(), body });
    if (res.success) {
      setTitle("");
      setBody("");
      await load();
    }
  }

  async function togglePin(n: NoteDTO) {
    const res = await NotesApi.updateNote(n.id, { pinned: !n.pinned });
    if (res.success) await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete note?")) return;
    const res = await NotesApi.deleteNote(id);
    if (res.success) await load();
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-4 max-w-md" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quick capture; pin important notes to the top.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New note</CardTitle>
          <CardDescription>Title is required; body is optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="note-title">Title</FieldLabel>
              <FieldContent>
                <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="note-body">Body</FieldLabel>
              <FieldContent>
                <Textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows={3} />
              </FieldContent>
            </Field>
            <Button type="submit">Save note</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {notes.map((n) => (
          <Card
            key={n.id}
            className={
              n.pinned
                ? "border-amber-500/40 bg-amber-500/5 dark:border-amber-500/30 dark:bg-amber-500/10"
                : undefined
            }
          >
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{n.title}</CardTitle>
                {n.pinned ? <Badge variant="secondary">Pinned</Badge> : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => void togglePin(n)}>
                  {n.pinned ? "Unpin" : "Pin"}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void remove(n.id)}>
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{n.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
