"use client";

import { create } from "zustand";
import * as JournalService from "@/modules/journal/services/journal.service";
import type { JournalEntryDTO, JournalAnalyticsDTO } from "@/types/planner";

export type JournalTab = "entries" | "favorites" | "analytics";
export type MoodFilter = "" | "amazing" | "good" | "neutral" | "bad" | "terrible";

export type JournalStore = {
  // ─── State ──────────────────────────────────────────────
  entries: JournalEntryDTO[];
  analytics: (JournalAnalyticsDTO & { promptOfTheDay: string }) | null;
  loading: boolean;
  tab: JournalTab;
  moodFilter: MoodFilter;
  search: string;
  dateFrom: string;
  dateTo: string;
  promptOfTheDay: string;
  quickCreateRequest: number;

  // ─── Actions ────────────────────────────────────────────
  setTab: (tab: JournalTab) => void;
  setMoodFilter: (mood: MoodFilter) => void;
  setSearch: (q: string) => void;
  setDateFrom: (d: string) => void;
  setDateTo: (d: string) => void;
  requestQuickCreate: () => void;

  load: () => Promise<void>;
  loadAnalytics: () => Promise<void>;

  createEntry: (input: Record<string, unknown>) => Promise<boolean>;
  updateEntry: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
  removeEntry: (id: string) => Promise<boolean>;
};

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],
  analytics: null,
  loading: true,
  tab: "entries",
  moodFilter: "",
  search: "",
  dateFrom: "",
  dateTo: "",
  promptOfTheDay: "",
  quickCreateRequest: 0,

  setTab: (tab) => set({ tab }),
  setMoodFilter: (moodFilter) => {
    set({ moodFilter });
    void get().load();
  },
  setSearch: (search) => set({ search }),
  setDateFrom: (dateFrom) => set({ dateFrom }),
  setDateTo: (dateTo) => set({ dateTo }),
  requestQuickCreate: () => set((s) => ({ quickCreateRequest: s.quickCreateRequest + 1 })),

  // ─── Load entries ──────────────────────────────────────
  load: async () => {
    set({ loading: true });
    const state = get();
    const opts: JournalService.JournalListOpts = {};
    if (state.moodFilter) opts.mood = state.moodFilter;
    if (state.search.trim()) opts.q = state.search.trim();
    if (state.dateFrom) opts.from = state.dateFrom;
    if (state.dateTo) opts.to = state.dateTo;

    const res = await JournalService.fetchJournal(opts);
    if (res.success && res.data) {
      const prompt = (res as { meta?: { promptOfTheDay?: string } }).meta?.promptOfTheDay ?? "";
      set({ entries: res.data, loading: false, promptOfTheDay: prompt });
    } else {
      set({ loading: false });
    }
  },

  // ─── Load analytics ───────────────────────────────────
  loadAnalytics: async () => {
    const res = await JournalService.fetchJournalAnalytics();
    if (res.success && res.data) {
      set({ analytics: res.data, promptOfTheDay: res.data.promptOfTheDay });
    }
  },

  // ─── Create entry ─────────────────────────────────────
  createEntry: async (input) => {
    const res = await JournalService.createJournalEntry(input);
    if (res.success) {
      await get().load();
      void get().loadAnalytics();
      return true;
    }
    return false;
  },

  // ─── Update entry ─────────────────────────────────────
  updateEntry: async (id, input) => {
    const res = await JournalService.updateJournalEntry(id, input);
    if (res.success) {
      await get().load();
      return true;
    }
    return false;
  },

  // ─── Toggle favorite ──────────────────────────────────
  toggleFavorite: async (id) => {
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return false;
    const res = await JournalService.updateJournalEntry(id, { isFavorite: !entry.isFavorite });
    if (res.success) {
      // Optimistic update
      set((s) => ({
        entries: s.entries.map((e) =>
          e.id === id ? { ...e, isFavorite: !e.isFavorite } : e
        ),
      }));
      return true;
    }
    return false;
  },

  // ─── Delete entry ─────────────────────────────────────
  removeEntry: async (id) => {
    const res = await JournalService.deleteJournalEntry(id);
    if (res.success) {
      await get().load();
      void get().loadAnalytics();
      return true;
    }
    return false;
  },
}));
