"use client";

import { useEffect } from "react";
import { useOverviewStore } from "@/modules/overview/store/overview-store";

/** Cross-module snapshot: planner summary + finance intelligence (Overview page & authenticated home). */
export function useOverviewDashboard() {
  useEffect(() => {
    void useOverviewStore.getState().load();
  }, []);
  return useOverviewStore();
}
