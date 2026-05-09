"use client";

import { create } from "zustand";
import * as GoalsService from "@/modules/goals/services/goals.service";
import type { GoalDTO, MilestoneDTO } from "@/types/planner";

export type GoalsStore = {
  goals: GoalDTO[];
  milestones: Record<string, MilestoneDTO[]>;
  loading: boolean;
  msg: string | null;
  load: () => Promise<void>;
  addGoal: (title: string) => Promise<void>;
  toggleMilestone: (goalId: string, m: MilestoneDTO) => Promise<void>;
  addMilestone: (goalId: string, title: string) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
};

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  goals: [],
  milestones: {},
  loading: true,
  msg: null,

  load: async () => {
    set({ loading: true });
    const res = await GoalsService.fetchGoals();
    if (res.success && res.data) {
      const ms: Record<string, MilestoneDTO[]> = {};
      for (const g of res.data) {
        const mr = await GoalsService.fetchMilestones(g.id);
        if (mr.success && mr.data) ms[g.id] = mr.data;
      }
      set({ goals: res.data, milestones: ms, loading: false });
    } else {
      set({ loading: false });
    }
  },

  addGoal: async (title: string) => {
    const res = await GoalsService.createGoal({ title, status: "active" });
    set({ msg: res.success ? "Goal added" : res.message });
    if (res.success) await get().load();
  },

  toggleMilestone: async (goalId: string, m: MilestoneDTO) => {
    const res = await GoalsService.updateMilestone(goalId, m.id, {
      completedAt: m.completedAt ? null : new Date().toISOString(),
    });
    if (res.success) await get().load();
  },

  addMilestone: async (goalId: string, title: string) => {
    if (!title.trim()) return;
    const res = await GoalsService.createMilestone(goalId, { title: title.trim() });
    if (res.success) await get().load();
  },

  removeGoal: async (id: string) => {
    if (!confirm("Delete this goal and its milestones?")) return;
    const res = await GoalsService.deleteGoal(id);
    if (res.success) await get().load();
  },
}));
