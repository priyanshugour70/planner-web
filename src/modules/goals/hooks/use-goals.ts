"use client";

import { useEffect } from "react";
import { useGoalsStore } from "@/modules/goals/stores/goals-store";

/** Goals module: loads on mount, exposes store actions for UI. */
export function useGoals() {
  useEffect(() => {
    void useGoalsStore.getState().load();
  }, []);
  return useGoalsStore();
}
