"use client";

import { useEffect } from "react";
import { useHabitsStore } from "@/modules/habits/store/habits-store";

export function useHabits() {
  useEffect(() => {
    void useHabitsStore.getState().load();
  }, []);
  return useHabitsStore();
}
