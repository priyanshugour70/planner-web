"use client";

import { create } from "zustand";
import * as JournalService from "@/modules/journal/services/journal.service";
import type { JournalEntryDTO } from "@/types/planner";

export type JournalStore = {
  entries: JournalEntryDTO[];
  loading: boolean;
  load: () => Promise<void>;
  saveEntry: (title: string, body: string) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
};

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],
  loading: true,

  load: async () => {
    set({ loading: true });
    const res = await JournalService.fetchJournal();
    if (res.success && res.data) set({ entries: res.data, loading: false });
    else set({ loading: false });
  },

  saveEntry: async (title: string, body: string) => {
    const res = await JournalService.createJournalEntry({ title: title || "Entry", body });
    if (res.success) await get().load();
  },

  removeEntry: async (id: string) => {
    if (!confirm("Delete entry?")) return;
    const res = await JournalService.deleteJournalEntry(id);
    if (res.success) await get().load();
  },
}));
