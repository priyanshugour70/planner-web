"use client";

import { create } from "zustand";
import { toast } from "sonner";
import * as FinanceService from "@/modules/finance/services/finance.service";
import type {
  BudgetDTO,
  BudgetRollupDTO,
  DebtObligationDTO,
  FinanceAccountDTO,
  FinanceCategoryDTO,
  FinanceSummaryDTO,
  TransactionDTO,
} from "@/types/planner";

export type FinanceTab = "transactions" | "budgets" | "accounts" | "debt";

export type FinanceStore = {
  tab: FinanceTab;
  intelOpen: boolean;
  transactions: TransactionDTO[];
  budgets: BudgetDTO[];
  budgetRollups: BudgetRollupDTO[];
  accounts: FinanceAccountDTO[];
  categories: FinanceCategoryDTO[];
  obligations: DebtObligationDTO[];
  summary: FinanceSummaryDTO | null;
  loading: boolean;
  setTab: (tab: FinanceTab) => void;
  setIntelOpen: (open: boolean | ((v: boolean) => boolean)) => void;
  load: () => Promise<void>;
  createTx: (input: Record<string, unknown>) => Promise<boolean>;
  updateTx: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  removeTx: (id: string) => Promise<boolean>;
  createBudget: (input: Record<string, unknown>) => Promise<boolean>;
  updateBudget: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  removeBudget: (id: string) => Promise<boolean>;
  createAccount: (input: Record<string, unknown>) => Promise<boolean>;
  updateAccount: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;
  createCategory: (input: Record<string, unknown>) => Promise<boolean>;
  updateCategory: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  createObligation: (input: Record<string, unknown>) => Promise<boolean>;
  updateObligation: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  deleteObligation: (id: string) => Promise<boolean>;
  recordDebtPayment: (obligationId: string, amount: number, note?: string) => Promise<boolean>;
};

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  tab: "transactions",
  intelOpen: true,
  transactions: [],
  budgets: [],
  budgetRollups: [],
  accounts: [],
  categories: [],
  obligations: [],
  summary: null,
  loading: true,

  setTab: (tab) => set({ tab }),
  setIntelOpen: (open) =>
    set((s) => ({ intelOpen: typeof open === "function" ? open(s.intelOpen) : open })),

  load: async () => {
    set({ loading: true });
    const [
      tr,
      br,
      roll,
      acc,
      cat,
      debt,
      fs,
    ] = await Promise.all([
      FinanceService.fetchTransactions({ limit: "100" }),
      FinanceService.fetchBudgets(),
      FinanceService.fetchBudgetRollup(),
      FinanceService.fetchFinanceAccounts(),
      FinanceService.fetchFinanceCategories(),
      FinanceService.fetchDebtObligations(),
      FinanceService.fetchFinanceSummary(),
    ]);

    if (!tr.success) toast.error(tr.message || "Could not load transactions");
    if (!br.success) toast.error(br.message || "Could not load budgets");
    if (!roll.success) toast.error(roll.message || "Could not load budget rollup");
    if (!acc.success) toast.error(acc.message || "Could not load accounts");
    if (!cat.success) toast.error(cat.message || "Could not load categories");
    if (!debt.success) toast.error(debt.message || "Could not load debt");
    if (!fs.success) toast.error(fs.message || "Could not load finance summary");

    set({
      loading: false,
      transactions: tr.success && tr.data ? tr.data : [],
      budgets: br.success && br.data ? br.data : [],
      budgetRollups: roll.success && roll.data ? roll.data : [],
      accounts: acc.success && acc.data ? acc.data : [],
      categories: cat.success && cat.data ? cat.data : [],
      obligations: debt.success && debt.data ? debt.data : [],
      summary: fs.success && fs.data ? fs.data : null,
    });
  },

  createTx: async (input) => {
    const res = await FinanceService.createTransaction(input);
    if (!res.success) {
      toast.error(res.message || "Could not save transaction");
      return false;
    }
    toast.success("Transaction saved");
    await get().load();
    return true;
  },

  updateTx: async (id, input) => {
    const res = await FinanceService.updateTransaction(id, input);
    if (!res.success) {
      toast.error(res.message || "Could not update transaction");
      return false;
    }
    toast.success("Transaction updated");
    await get().load();
    return true;
  },

  removeTx: async (id) => {
    const res = await FinanceService.deleteTransaction(id);
    if (!res.success) {
      toast.error(res.message || "Could not delete transaction");
      return false;
    }
    toast.success("Transaction removed");
    await get().load();
    return true;
  },

  createBudget: async (input) => {
    const res = await FinanceService.createBudget(input);
    if (!res.success) {
      toast.error(res.message || "Could not create budget");
      return false;
    }
    toast.success("Budget created");
    await get().load();
    return true;
  },

  updateBudget: async (id, input) => {
    const res = await FinanceService.updateBudget(id, input);
    if (!res.success) {
      toast.error(res.message || "Could not update budget");
      return false;
    }
    toast.success("Budget updated");
    await get().load();
    return true;
  },

  removeBudget: async (id) => {
    if (!confirm("Delete budget?")) return false;
    const res = await FinanceService.deleteBudget(id);
    if (!res.success) {
      toast.error(res.message || "Could not delete budget");
      return false;
    }
    toast.success("Budget deleted");
    await get().load();
    return true;
  },

  createAccount: async (input) => {
    const res = await FinanceService.createFinanceAccount(input);
    if (!res.success) {
      toast.error(res.message || "Could not create account");
      return false;
    }
    toast.success("Account created");
    await get().load();
    return true;
  },

  updateAccount: async (id, input) => {
    const res = await FinanceService.updateFinanceAccount(id, input);
    if (!res.success) {
      toast.error(res.message || "Could not update account");
      return false;
    }
    toast.success("Account updated");
    await get().load();
    return true;
  },

  deleteAccount: async (id) => {
    if (!confirm("Delete this account? Linked transactions keep history with a blank account.")) return false;
    const res = await FinanceService.deleteFinanceAccount(id);
    if (!res.success) {
      toast.error(res.message || "Could not delete account");
      return false;
    }
    toast.success("Account deleted");
    await get().load();
    return true;
  },

  createCategory: async (input) => {
    const res = await FinanceService.createFinanceCategory(input);
    if (!res.success) {
      toast.error(res.message || "Could not create category");
      return false;
    }
    toast.success("Category created");
    await get().load();
    return true;
  },

  updateCategory: async (id, input) => {
    const res = await FinanceService.updateFinanceCategory(id, input);
    if (!res.success) {
      toast.error(res.message || "Could not update category");
      return false;
    }
    toast.success("Category updated");
    await get().load();
    return true;
  },

  deleteCategory: async (id) => {
    if (!confirm("Delete this category?")) return false;
    const res = await FinanceService.deleteFinanceCategory(id);
    if (!res.success) {
      toast.error(res.message || "Could not delete category");
      return false;
    }
    toast.success("Category deleted");
    await get().load();
    return true;
  },

  createObligation: async (input) => {
    const res = await FinanceService.createDebtObligation(input);
    if (!res.success) {
      toast.error(res.message || "Could not save debt");
      return false;
    }
    toast.success("Debt saved");
    await get().load();
    return true;
  },

  updateObligation: async (id, input) => {
    const res = await FinanceService.updateDebtObligation(id, input);
    if (!res.success) {
      toast.error(res.message || "Could not update debt");
      return false;
    }
    toast.success("Debt updated");
    await get().load();
    return true;
  },

  deleteObligation: async (id) => {
    if (!confirm("Delete this debt record and its payment history?")) return false;
    const res = await FinanceService.deleteDebtObligation(id);
    if (!res.success) {
      toast.error(res.message || "Could not delete debt");
      return false;
    }
    toast.success("Debt deleted");
    await get().load();
    return true;
  },

  recordDebtPayment: async (obligationId, amount, note) => {
    const res = await FinanceService.createDebtPayment(obligationId, { amount, note: note ?? null });
    if (!res.success) {
      toast.error(res.message || "Could not record payment");
      return false;
    }
    toast.success("Payment recorded");
    await get().load();
    return true;
  },
}));
