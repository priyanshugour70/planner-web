"use client";

import { create } from "zustand";
import * as CalendarService from "@/modules/calendar/services/calendar.service";
import type { CalendarEventDTO } from "@/types/planner";

function rangeIso(daysBack: number, daysForward: number) {
  const from = new Date(Date.now() - daysBack * 86400000);
  const to = new Date(Date.now() + daysForward * 86400000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export type CalendarStore = {
  events: CalendarEventDTO[];
  loading: boolean;
  selectedMonth: string; // YYYY-MM
  summary: Record<string, {
    tasks: any[];
    habits: any[];
    journals: any[];
    notes: any[];
    transactions: any[];
    events: any[];
  }>;
  summaryLoading: boolean;
  load: () => Promise<void>;
  setMonth: (month: string) => Promise<void>;
  loadSummary: () => Promise<void>;
  addEvent: (input: { title: string; startsAt: string; endsAt: string }) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
};

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  loading: true,
  selectedMonth: new Date().toISOString().slice(0, 7),
  summary: {},
  summaryLoading: false,

  load: async () => {
    set({ loading: true });
    const { from, to } = rangeIso(1, 14);
    const res = await CalendarService.fetchCalendarEvents(from, to);
    if (res.success && res.data) set({ events: res.data, loading: false });
    else set({ loading: false });
    await get().loadSummary();
  },

  setMonth: async (month: string) => {
    set({ selectedMonth: month });
    await get().loadSummary();
  },

  loadSummary: async () => {
    set({ summaryLoading: true });
    const res = await CalendarService.fetchDailySummary(get().selectedMonth);
    if (res.success && res.data) {
      set({ summary: res.data, summaryLoading: false });
    } else {
      set({ summaryLoading: false });
    }
  },

  addEvent: async (input) => {
    const res = await CalendarService.createCalendarEvent({
      title: input.title.trim(),
      startsAt: new Date(input.startsAt).toISOString(),
      endsAt: new Date(input.endsAt).toISOString(),
    });
    if (res.success) {
      await get().load();
    }
  },

  removeEvent: async (id: string) => {
    if (!confirm("Delete event?")) return;
    const res = await CalendarService.deleteCalendarEvent(id);
    if (res.success) {
      await get().load();
    }
  },
}));
