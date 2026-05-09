"use client";

import { create } from "zustand";
import * as FinanceService from "@/modules/finance/services/finance.service";
import type { BudgetDTO, FinanceSummaryDTO, TransactionDTO } from "@/types/planner";

export type FinanceStore = {
  tab: "tx" | "budgets";
  intelOpen: boolean;
  transactions: TransactionDTO[];
  budgets: BudgetDTO[];
  summary: FinanceSummaryDTO | null;
  loading: boolean;
  setTab: (tab: "tx" | "budgets") => void;
  setIntelOpen: (open: boolean | ((v: boolean) => boolean)) => void;
  load: () => Promise<void>;
  createTx: (input: { kind: "income" | "expense"; amount: number; category?: string }) => Promise<void>;
  removeTx: (id: string) => Promise<void>;
  createBudget: (input: { name: string; amountLimit: number; periodStart: string; periodEnd: string }) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
};

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  tab: "tx",
  intelOpen: true,
  transactions: [],
  budgets: [],
  summary: null,
  loading: true,

  setTab: (tab) => set({ tab }),
  setIntelOpen: (open) =>
    set((s) => ({ intelOpen: typeof open === "function" ? open(s.intelOpen) : open })),

  load: async () => {
    set({ loading: true });
    const [tr, br, fs] = await Promise.all([
      FinanceService.fetchTransactions({ limit: "100" }),
      FinanceService.fetchBudgets(),
      FinanceService.fetchFinanceSummary(),
    ]);
    set({
      loading: false,
      transactions: tr.success && tr.data ? tr.data : [],
      budgets: br.success && br.data ? br.data : [],
      summary: fs.success && fs.data ? fs.data : null,
    });
  },

  createTx: async (input) => {
    const res = await FinanceService.createTransaction({
      kind: input.kind,
      amount: input.amount,
      category: input.category,
    });
    if (res.success) await get().load();
  },

  removeTx: async (id: string) => {
    const res = await FinanceService.deleteTransaction(id);
    if (res.success) await get().load();
  },

  createBudget: async (input) => {
    const res = await FinanceService.createBudget({
      name: input.name,
      amountLimit: input.amountLimit,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    });
    if (res.success) await get().load();
  },

  removeBudget: async (id: string) => {
    if (!confirm("Delete budget?")) return;
    const res = await FinanceService.deleteBudget(id);
    if (res.success) await get().load();
  },
}));
