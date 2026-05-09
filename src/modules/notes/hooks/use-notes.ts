"use client";

import { useEffect } from "react";
import { useNotesStore } from "@/modules/notes/stores/notes-store";

export function useNotes() {
  useEffect(() => {
    void useNotesStore.getState().load();
  }, []);
  return useNotesStore();
}
