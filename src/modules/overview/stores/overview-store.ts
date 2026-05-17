"use client";

import { create } from "zustand";
import * as FinanceService from "@/modules/finance/services/finance.service";
import * as OverviewService from "@/modules/overview/services/overview.service";
import type { FinanceSummaryDTO, PlannerSummaryDTO } from "@/types/planner";

export type OverviewStore = {
  summary: PlannerSummaryDTO | null;
  financeSummary: FinanceSummaryDTO | null;
  monthlyUpdates: Record<string, {
    tasks: number;
    habits: number;
    journals: number;
    notes: number;
    transactions: number;
    events: number;
    total: number;
  }> | null;
  loading: boolean;
  load: () => Promise<void>;
};

export const useOverviewStore = create<OverviewStore>((set) => ({
  summary: null,
  financeSummary: null,
  monthlyUpdates: null,
  loading: true,

  load: async () => {
    set({ loading: true });
    const month = new Date().toISOString().slice(0, 7);
    const [res, f, u] = await Promise.all([
      OverviewService.fetchSummary(),
      FinanceService.fetchFinanceSummary(),
      OverviewService.fetchSummaryUpdates(month),
    ]);
    set({
      loading: false,
      summary: res.success && res.data ? res.data : null,
      financeSummary: f.success && f.data ? f.data : null,
      monthlyUpdates: u.success && u.data ? u.data : null,
    });
  },
}));
