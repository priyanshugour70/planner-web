"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as Planner from "@/services/planner.service";
import type { CalendarEventDTO } from "@/types/planner";

function rangeIso(daysBack: number, daysForward: number) {
  const from = new Date(Date.now() - daysBack * 86400000);
  const to = new Date(Date.now() + daysForward * 86400000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [title, setTitle] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = rangeIso(1, 14);
    const res = await Planner.fetchCalendarEvents(from, to);
    if (res.success && res.data) setEvents(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !starts || !ends) return;
    const res = await Planner.createCalendarEvent({
      title: title.trim(),
      startsAt: new Date(starts).toISOString(),
      endsAt: new Date(ends).toISOString(),
    });
    if (res.success) {
      setTitle("");
      setStarts("");
      setEnds("");
      await load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete event?")) return;
    const res = await Planner.deleteCalendarEvent(id);
    if (res.success) await load();
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 max-w-lg" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Time-boxed events with optional links to tasks and goals (via API fields).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New event</CardTitle>
          <CardDescription>Pick start and end in your local timezone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="event-title">Title</FieldLabel>
              <FieldContent>
                <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="event-starts">Starts</FieldLabel>
              <FieldContent>
                <Input
                  id="event-starts"
                  type="datetime-local"
                  value={starts}
                  onChange={(e) => setStarts(e.target.value)}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="event-ends">Ends</FieldLabel>
              <FieldContent>
                <Input id="event-ends" type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
              </FieldContent>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Add event</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead className="hidden md:table-cell">When</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full border" style={{ backgroundColor: ev.color }} />
                      <span className="font-medium">{ev.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground md:hidden">
                      {ev.startsAt ? new Date(ev.startsAt).toLocaleString() : ""} –{" "}
                      {ev.endsAt ? new Date(ev.endsAt).toLocaleString() : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {ev.startsAt ? new Date(ev.startsAt).toLocaleString() : ""} –{" "}
                    {ev.endsAt ? new Date(ev.endsAt).toLocaleString() : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void remove(ev.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events in the next two weeks.</p>
      ) : null}
    </div>
  );
}
