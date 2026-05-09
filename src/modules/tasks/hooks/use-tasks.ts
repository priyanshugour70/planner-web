"use client";

import { useEffect } from "react";
import { useTasksStore } from "@/modules/tasks/stores/tasks-store";

export function useTasks() {
  useEffect(() => {
    void useTasksStore.getState().load();
  }, []);
  return useTasksStore();
}
