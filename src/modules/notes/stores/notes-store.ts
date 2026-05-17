"use client";

import { create } from "zustand";
import * as NotesService from "@/modules/notes/services/notes.service";
import type { NoteDTO } from "@/types/planner";

export type NotesStore = {
  notes: NoteDTO[];
  loading: boolean;
  load: () => Promise<void>;
  addNote: (title: string, body: string) => Promise<NoteDTO | null>;
  togglePin: (n: NoteDTO) => Promise<void>;
  update: (id: string, updates: Partial<NoteDTO>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  loading: true,

  load: async () => {
    set({ loading: true });
    const res = await NotesService.fetchNotes();
    if (res.success && res.data) set({ notes: res.data, loading: false });
    else set({ loading: false });
  },

  addNote: async (title: string, body: string) => {
    const res = await NotesService.createNote({ title, body });
    if (res.success && res.data) {
      await get().load();
      return res.data;
    }
    return null;
  },

  togglePin: async (n: NoteDTO) => {
    const res = await NotesService.updateNote(n.id, { pinned: !n.pinned });
    if (res.success) await get().load();
  },

  update: async (id: string, updates: Partial<NoteDTO>) => {
    const res = await NotesService.updateNote(id, updates);
    if (res.success) {
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      }));
    }
  },

  remove: async (id: string) => {
    if (!confirm("Delete note?")) return;
    const res = await NotesService.deleteNote(id);
    if (res.success) await get().load();
  },
}));
