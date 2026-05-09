"use client";

import { useEffect } from "react";
import { useFinanceStore } from "@/modules/finance/store/finance-store";

export function useFinance() {
  useEffect(() => {
    void useFinanceStore.getState().load();
  }, []);
  return useFinanceStore();
}
