"use client";

import { useEffect } from "react";
import { useJournalStore } from "@/modules/journal/store/journal-store";

export function useJournal() {
  useEffect(() => {
    void useJournalStore.getState().load();
  }, []);
  return useJournalStore();
}
