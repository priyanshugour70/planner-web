"use client";

import { create } from "zustand";
import * as NotesService from "@/modules/notes/services/notes.service";
import type { NoteDTO } from "@/types/planner";

export type NotesStore = {
  notes: NoteDTO[];
  loading: boolean;
  load: () => Promise<void>;
  addNote: (title: string, body: string) => Promise<void>;
  togglePin: (n: NoteDTO) => Promise<void>;
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
    if (res.success) await get().load();
  },

  togglePin: async (n: NoteDTO) => {
    const res = await NotesService.updateNote(n.id, { pinned: !n.pinned });
    if (res.success) await get().load();
  },

  remove: async (id: string) => {
    if (!confirm("Delete note?")) return;
    const res = await NotesService.deleteNote(id);
    if (res.success) await get().load();
  },
}));
