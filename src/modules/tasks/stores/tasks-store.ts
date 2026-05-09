"use client";

import { create } from "zustand";
import * as TasksService from "@/modules/tasks/services/tasks.service";
import type { TaskDTO } from "@/types/planner";

export type TasksStore = {
  filter: string;
  tasks: TaskDTO[];
  loading: boolean;
  setFilter: (filter: string) => void;
  load: () => Promise<void>;
  addTask: (title: string) => Promise<void>;
  markDone: (t: TaskDTO) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useTasksStore = create<TasksStore>((set, get) => ({
  filter: "",
  tasks: [],
  loading: true,

  setFilter: (filter) => {
    set({ filter });
    void get().load();
  },

  load: async () => {
    set({ loading: true });
    const { filter } = get();
    const res = await TasksService.fetchTasks(filter ? { status: filter } : {});
    if (res.success && res.data) set({ tasks: res.data, loading: false });
    else set({ loading: false });
  },

  addTask: async (title: string) => {
    const res = await TasksService.createTask({ title, status: "todo" });
    if (res.success) await get().load();
  },

  markDone: async (t: TaskDTO) => {
    const res = await TasksService.updateTask(t.id, {
      status: t.status === "done" ? "todo" : "done",
      completedAt: t.status === "done" ? null : new Date().toISOString(),
    });
    if (res.success) await get().load();
  },

  remove: async (id: string) => {
    if (!confirm("Delete task?")) return;
    const res = await TasksService.deleteTask(id);
    if (res.success) await get().load();
  },
}));
