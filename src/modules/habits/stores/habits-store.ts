"use client";

import { create } from "zustand";
import * as HabitsService from "@/modules/habits/services/habits.service";
import type { HabitDTO, HabitEntryDTO, HabitAnalyticsDTO, HabitsSummaryDTO } from "@/types/planner";

export type HabitsTab = "overview" | "all" | "archived";

export type HabitsStore = {
  // ─── State ──────────────────────────────────────────────
  habits: HabitDTO[];
  entries: Record<string, HabitEntryDTO[]>;
  analytics: Record<string, HabitAnalyticsDTO>;
  summary: HabitsSummaryDTO | null;
  loading: boolean;
  tab: HabitsTab;
  search: string;
  quickCreateRequest: number;

  // ─── Actions ────────────────────────────────────────────
  setTab: (tab: HabitsTab) => void;
  setSearch: (q: string) => void;
  requestQuickCreate: () => void;

  load: () => Promise<void>;
  loadArchived: () => Promise<void>;
  loadAnalytics: () => Promise<void>;

  createHabit: (input: Record<string, unknown>) => Promise<boolean>;
  updateHabit: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  archiveHabit: (id: string) => Promise<boolean>;
  unarchiveHabit: (id: string) => Promise<boolean>;
  removeHabit: (id: string) => Promise<boolean>;

  logEntry: (habitId: string, entryDate: string, count?: number, note?: string) => Promise<boolean>;
  removeEntry: (habitId: string, entryId: string) => Promise<boolean>;
  loadEntries: (habitId: string) => Promise<void>;
};

export const useHabitsStore = create<HabitsStore>((set, get) => ({
  habits: [],
  entries: {},
  analytics: {},
  summary: null,
  loading: true,
  tab: "overview",
  search: "",
  quickCreateRequest: 0,

  setTab: (tab) => set({ tab }),
  setSearch: (search) => set({ search }),
  requestQuickCreate: () => set((s) => ({ quickCreateRequest: s.quickCreateRequest + 1 })),

  // ─── Load active habits ────────────────────────────────
  load: async () => {
    set({ loading: true });
    const res = await HabitsService.fetchHabits();
    if (res.success && res.data) {
      // Load entries for each habit
      const en: Record<string, HabitEntryDTO[]> = {};
      for (const h of res.data) {
        const er = await HabitsService.fetchHabitEntries(h.id, { limit: 60 });
        if (er.success && er.data) en[h.id] = er.data;
      }
      set({ habits: res.data, entries: en, loading: false });
    } else {
      set({ loading: false });
    }
  },

  // ─── Load archived habits ──────────────────────────────
  loadArchived: async () => {
    const res = await HabitsService.fetchHabits({ archived: true });
    if (res.success && res.data) {
      // Merge with existing habits, replacing any archived ones
      set((s) => {
        const active = s.habits.filter((h) => !h.archived);
        return { habits: [...active, ...res.data!] };
      });
    }
  },

  // ─── Load analytics ───────────────────────────────────
  loadAnalytics: async () => {
    const res = await HabitsService.fetchHabitsAnalytics();
    if (res.success && res.data) {
      const map: Record<string, HabitAnalyticsDTO> = {};
      for (const a of res.data.habits) {
        map[a.habitId] = a;
      }
      set({ analytics: map, summary: res.data.summary });
    }
  },

  // ─── Create ────────────────────────────────────────────
  createHabit: async (input) => {
    const res = await HabitsService.createHabit(input);
    if (res.success) {
      await get().load();
      void get().loadAnalytics();
      return true;
    }
    return false;
  },

  // ─── Update ────────────────────────────────────────────
  updateHabit: async (id, input) => {
    const res = await HabitsService.updateHabit(id, input);
    if (res.success) {
      await get().load();
      return true;
    }
    return false;
  },

  // ─── Archive / Unarchive ───────────────────────────────
  archiveHabit: async (id) => {
    const res = await HabitsService.updateHabit(id, { archived: true });
    if (res.success) {
      await get().load();
      void get().loadAnalytics();
      return true;
    }
    return false;
  },
  unarchiveHabit: async (id) => {
    const res = await HabitsService.updateHabit(id, { archived: false });
    if (res.success) {
      await get().load();
      await get().loadArchived();
      void get().loadAnalytics();
      return true;
    }
    return false;
  },

  // ─── Delete ────────────────────────────────────────────
  removeHabit: async (id) => {
    const res = await HabitsService.deleteHabit(id);
    if (res.success) {
      await get().load();
      void get().loadAnalytics();
      return true;
    }
    return false;
  },

  // ─── Log entry ─────────────────────────────────────────
  logEntry: async (habitId, entryDate, count = 1, note) => {
    const body: Record<string, unknown> = { entryDate, count };
    if (note) body.note = note;
    const res = await HabitsService.logHabitEntry(habitId, body);
    if (res.success) {
      await get().loadEntries(habitId);
      void get().loadAnalytics();
      return true;
    }
    return false;
  },

  // ─── Remove entry ─────────────────────────────────────
  removeEntry: async (habitId, entryId) => {
    const res = await HabitsService.deleteHabitEntry(habitId, entryId);
    if (res.success) {
      await get().loadEntries(habitId);
      void get().loadAnalytics();
      return true;
    }
    return false;
  },

  // ─── Load entries for a specific habit ─────────────────
  loadEntries: async (habitId) => {
    const res = await HabitsService.fetchHabitEntries(habitId, { limit: 60 });
    if (res.success && res.data) {
      set((s) => ({
        entries: { ...s.entries, [habitId]: res.data! },
      }));
    }
  },
}));
