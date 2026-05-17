"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCalendar } from "@/modules/calendar/hooks/use-calendar";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  CheckSquare,
  BookOpen,
  FileText,
  Flame,
  Coins,
  MapPin,
  Clock,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";

export function CalendarView() {
  const store = useCalendar();
  const {
    events,
    loading,
    selectedMonth,
    summary,
    summaryLoading,
    setMonth,
    addEvent,
    removeEvent
  } = store;

  const [newEventOpen, setNewEventOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  // Event form states
  const [title, setTitle] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");

  // Calculate month helper
  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    setMonth(prevDate.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    setMonth(nextDate.toISOString().slice(0, 7));
  };

  // Generate 42 calendar grid days
  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const days = [];

    // Prev month padding
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Current month days
    const totalDays = lastDay.getDate();
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month - 1, i);
      days.push({ date: currDate, isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  }, [selectedMonth]);

  // Selected date details
  const activeDayDetails = useMemo(() => {
    if (!selectedDateStr) return null;
    return summary[selectedDateStr] || { tasks: [], habits: [], journals: [], notes: [], transactions: [], events: [] };
  }, [selectedDateStr, summary]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !starts || !ends) return;
    await addEvent({ title: title.trim(), startsAt: starts, endsAt: ends });
    setTitle("");
    setStarts("");
    setEnds("");
    setNewEventOpen(false);
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Calendar Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly cross-module planner timeline. Monitor tasks, habits, and journals at a glance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border rounded-lg p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold px-4 min-w-[120px] text-center">
              {monthLabel}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => setNewEventOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Monthly Grid */}
        <div className="lg:col-span-3 space-y-4">
          {summaryLoading && (
            <div className="text-center py-2 text-xs text-muted-foreground animate-pulse">
              Syncing daily summaries...
            </div>
          )}
          
          <div className="border border-border rounded-xl bg-card shadow-md overflow-hidden">
            {/* Weekdays Row */}
            <div className="grid grid-cols-7 bg-muted/30 border-b border-border text-center py-2">
              {weekdays.map((day) => (
                <div key={day} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-border bg-card">
              {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                const dateStr = date.toISOString().slice(0, 10);
                const daySummary = summary[dateStr];
                
                // Calculate counts
                const taskCount = daySummary?.tasks?.length || 0;
                const habitCount = daySummary?.habits?.length || 0;
                const journalCount = daySummary?.journals?.length || 0;
                const noteCount = daySummary?.notes?.length || 0;
                const txCount = daySummary?.transactions?.length || 0;
                const evCount = daySummary?.events?.length || 0;
                const totalUpdates = taskCount + habitCount + journalCount + noteCount + txCount + evCount;

                const isSelected = selectedDateStr === dateStr;
                const isToday = new Date().toISOString().slice(0, 10) === dateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`min-h-[100px] p-2 flex flex-col justify-between cursor-pointer hover:bg-muted/50 transition-all ${
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground/40 bg-muted/5"
                    } ${isSelected ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold rounded-full h-6 w-6 flex items-center justify-center ${
                        isToday ? "bg-primary text-primary-foreground shadow" : ""
                      }`}>
                        {date.getDate()}
                      </span>
                      {totalUpdates > 0 && (
                        <span className="text-[10px] bg-accent/15 text-accent font-medium px-1.5 py-0.5 rounded-full">
                          {totalUpdates}
                        </span>
                      )}
                    </div>

                    {/* Quick activity dots */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {taskCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title={`${taskCount} Tasks`} />}
                      {habitCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" title={`${habitCount} Habits`} />}
                      {journalCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" title={`${journalCount} Journals`} />}
                      {noteCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title={`${noteCount} Notes`} />}
                      {txCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" title={`${txCount} Transactions`} />}
                      {evCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-purple-500" title={`${evCount} Events`} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Daily Summary Side Panel */}
        <div className="lg:col-span-1">
          {selectedDateStr ? (
            <Card className="h-full border border-border shadow-md bg-card/50 backdrop-blur-sm sticky top-6">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-3 space-y-0">
                <div>
                  <CardTitle className="text-base font-bold">
                    {new Date(selectedDateStr).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric"
                    })}
                  </CardTitle>
                  <CardDescription>Updates registered on this day</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDateStr(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {/* 1. Calendar Events */}
                {activeDayDetails?.events && activeDayDetails.events.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-purple-500" /> Events
                    </h3>
                    <div className="space-y-1.5">
                      {activeDayDetails.events.map((ev: any) => (
                        <div key={ev.id} className="p-2 border rounded-lg bg-card/80 flex justify-between items-start">
                          <div className="flex gap-2 items-start">
                            <span className="h-2 w-2 shrink-0 rounded-full mt-1.5" style={{ backgroundColor: ev.color }} />
                            <div>
                              <p className="text-sm font-semibold">{ev.title}</p>
                              {ev.location && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" /> {ev.location}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => void removeEvent(ev.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Tasks */}
                {activeDayDetails?.tasks && activeDayDetails.tasks.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-500" /> Tasks
                    </h3>
                    <div className="space-y-1.5">
                      {activeDayDetails.tasks.map((t: any) => (
                        <Link href="/tasks" key={t.id} className="block p-2 border rounded-lg bg-card/80 hover:bg-accent transition-colors">
                          <p className="text-sm font-semibold truncate">{t.title}</p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-1 ${
                            t.status === "done" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {t.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Habits */}
                {activeDayDetails?.habits && activeDayDetails.habits.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-rose-500" /> Habits Logged
                    </h3>
                    <div className="space-y-1.5">
                      {activeDayDetails.habits.map((h: any) => (
                        <div key={h.id} className="p-2 border rounded-lg bg-card/80 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{h.name}</p>
                            {h.note && <p className="text-xs text-muted-foreground mt-0.5 italic">"{h.note}"</p>}
                          </div>
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Journal Logs */}
                {activeDayDetails?.journals && activeDayDetails.journals.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" /> Journal Entries
                    </h3>
                    <div className="space-y-1.5">
                      {activeDayDetails.journals.map((j: any) => (
                        <Link href="/journal" key={j.id} className="block p-2 border rounded-lg bg-card/80 hover:bg-accent transition-colors">
                          <p className="text-sm font-semibold truncate">{j.title || "Untitled"}</p>
                          <span className="text-[10px] bg-blue-500/10 text-blue-500 font-medium px-1.5 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wider">
                            Mood: {j.mood || "neutral"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Notes */}
                {activeDayDetails?.notes && activeDayDetails.notes.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-amber-500" /> Notes Updated
                    </h3>
                    <div className="space-y-1.5">
                      {activeDayDetails.notes.map((n: any) => (
                        <Link href="/notes" key={n.id} className="block p-2 border rounded-lg bg-card/80 hover:bg-accent transition-colors">
                          <p className="text-sm font-semibold truncate">{n.title || "Untitled"}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Finance Transactions */}
                {activeDayDetails?.transactions && activeDayDetails.transactions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-cyan-500" /> Transactions
                    </h3>
                    <div className="space-y-1.5">
                      {activeDayDetails.transactions.map((tx: any) => (
                        <Link href="/finance" key={tx.id} className="block p-2 border rounded-lg bg-card/80 hover:bg-accent transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="text-sm font-semibold truncate">{tx.category || "General"}</p>
                              {tx.note && <p className="text-xs text-muted-foreground truncate">{tx.note}</p>}
                            </div>
                            <span className={`text-sm font-bold shrink-0 ${
                              tx.kind === "expense" ? "text-rose-500" : "text-emerald-500"
                            }`}>
                              {tx.kind === "expense" ? "-" : "+"}₹{Number(tx.amount).toLocaleString()}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* No activity */}
                {activeDayDetails &&
                  Object.values(activeDayDetails).every((arr: any) => arr.length === 0) && (
                    <div className="text-center py-12 text-muted-foreground/60">
                      <p className="text-sm">No activity recorded on this day.</p>
                    </div>
                  )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full border border-border shadow-md bg-muted/10 border-dashed flex flex-col items-center justify-center p-6 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <h3 className="font-semibold text-sm">No day selected</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Click any day in the calendar grid to view detailed module updates.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* New Event Dialog Modal */}
      {newEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border shadow-2xl bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <div>
                <CardTitle className="text-lg">Create New Event</CardTitle>
                <CardDescription>Block time on your calendar schedule</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNewEventOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={onAdd} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meet with team, gym etc." required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starts</label>
                    <Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ends</label>
                    <Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} required />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setNewEventOpen(false)}>Cancel</Button>
                  <Button type="submit">Add Event</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
