"use client";

import { create } from "zustand";
import * as FinanceService from "@/modules/finance/services/finance.service";
import * as OverviewService from "@/modules/overview/services/overview.service";
import type { FinanceSummaryDTO, PlannerSummaryDTO } from "@/types/planner";

export type OverviewStore = {
  summary: PlannerSummaryDTO | null;
  financeSummary: FinanceSummaryDTO | null;
  loading: boolean;
  load: () => Promise<void>;
};

export const useOverviewStore = create<OverviewStore>((set) => ({
  summary: null,
  financeSummary: null,
  loading: true,

  load: async () => {
    set({ loading: true });
    const [res, f] = await Promise.all([
      OverviewService.fetchSummary(),
      FinanceService.fetchFinanceSummary(),
    ]);
    set({
      loading: false,
      summary: res.success && res.data ? res.data : null,
      financeSummary: f.success && f.data ? f.data : null,
    });
  },
}));
