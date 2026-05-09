"use client";

import { create } from "zustand";
import * as HabitsService from "@/modules/habits/services/habits.service";
import type { HabitDTO, HabitEntryDTO } from "@/types/planner";

export type HabitsStore = {
  habits: HabitDTO[];
  entries: Record<string, HabitEntryDTO[]>;
  loading: boolean;
  load: () => Promise<void>;
  addHabit: (name: string) => Promise<void>;
  logToday: (habitId: string) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
};

export const useHabitsStore = create<HabitsStore>((set, get) => ({
  habits: [],
  entries: {},
  loading: true,

  load: async () => {
    set({ loading: true });
    const res = await HabitsService.fetchHabits();
    if (res.success && res.data) {
      const en: Record<string, HabitEntryDTO[]> = {};
      for (const h of res.data) {
        const er = await HabitsService.fetchHabitEntries(h.id);
        if (er.success && er.data) en[h.id] = er.data;
      }
      set({ habits: res.data, entries: en, loading: false });
    } else {
      set({ loading: false });
    }
  },

  addHabit: async (name: string) => {
    const res = await HabitsService.createHabit({ name });
    if (res.success) await get().load();
  },

  logToday: async (habitId: string) => {
    const d = new Date().toISOString().slice(0, 10);
    const res = await HabitsService.logHabitEntry(habitId, { entryDate: d, count: 1 });
    if (res.success) await get().load();
  },

  removeHabit: async (id: string) => {
    if (!confirm("Delete habit and its history?")) return;
    const res = await HabitsService.deleteHabit(id);
    if (res.success) await get().load();
  },
}));
