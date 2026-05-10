"use client";

import { create } from "zustand";
import { toast } from "sonner";
import * as TasksService from "@/modules/tasks/services/tasks.service";
import type { TaskListParams } from "@/modules/tasks/services/tasks.service";
import type { TaskDTO } from "@/types/planner";

export type TaskSort = NonNullable<TaskListParams["sort"]>;

export type TasksStore = {
  filterStatus: string;
  sort: TaskSort;
  search: string;
  rootsOnly: boolean;
  goalIdFilter: string;
  tasks: TaskDTO[];
  loading: boolean;
  setFilterStatus: (v: string) => void;
  setSort: (v: TaskSort) => void;
  setSearch: (v: string) => void;
  setRootsOnly: (v: boolean) => void;
  setGoalIdFilter: (v: string) => void;
  load: () => Promise<void>;
  createTask: (body: Record<string, unknown>) => Promise<boolean>;
  updateTask: (id: string, body: Record<string, unknown>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};

export const useTasksStore = create<TasksStore>((set, get) => ({
  filterStatus: "",
  sort: "due",
  search: "",
  rootsOnly: false,
  goalIdFilter: "",
  tasks: [],
  loading: true,

  setFilterStatus: (filterStatus) => {
    set({ filterStatus });
    void get().load();
  },
  setSort: (sort) => {
    set({ sort });
    void get().load();
  },
  setSearch: (search) => set({ search }),
  setRootsOnly: (rootsOnly) => {
    set({ rootsOnly });
    void get().load();
  },
  setGoalIdFilter: (goalIdFilter) => {
    set({ goalIdFilter });
    void get().load();
  },

  load: async () => {
    set({ loading: true });
    const { filterStatus, sort, search, rootsOnly, goalIdFilter } = get();
    const res = await TasksService.fetchTasks({
      status: filterStatus || undefined,
      sort,
      q: search.trim() || undefined,
      rootsOnly: rootsOnly || undefined,
      goalId: goalIdFilter || undefined,
      limit: 250,
    });
    if (!res.success) {
      toast.error(res.message || "Could not load tasks");
      set({ loading: false });
      return;
    }
    set({ tasks: res.data ?? [], loading: false });
  },

  createTask: async (body) => {
    const res = await TasksService.createTask(body);
    if (!res.success) {
      toast.error(res.message || "Could not create task");
      return false;
    }
    toast.success("Task created");
    await get().load();
    return true;
  },

  updateTask: async (id, body) => {
    const res = await TasksService.updateTask(id, body);
    if (!res.success) {
      toast.error(res.message || "Could not update task");
      return false;
    }
    toast.success("Task updated");
    await get().load();
    return true;
  },

  remove: async (id) => {
    if (!confirm("Delete this task? Sub-tasks are removed with it.")) return false;
    const res = await TasksService.deleteTask(id);
    if (!res.success) {
      toast.error(res.message || "Could not delete task");
      return false;
    }
    toast.success("Task deleted");
    await get().load();
    return true;
  },
}));
