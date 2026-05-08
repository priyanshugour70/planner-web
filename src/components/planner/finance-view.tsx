"use client";

import { useCallback, useEffect, useState } from "react";
import * as Planner from "@/services/planner.service";
import type { BudgetDTO, TransactionDTO } from "@/types/planner";

export function FinanceView() {
  const [tab, setTab] = useState<"tx" | "budgets">("tx");
  const [tx, setTx] = useState<TransactionDTO[]>([]);
  const [budgets, setBudgets] = useState<BudgetDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [tr, br] = await Promise.all([Planner.fetchTransactions(), Planner.fetchBudgets()]);
    if (tr.success && tr.data) setTx(tr.data);
    if (br.success && br.data) setBudgets(br.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  if (loading) return <p className="text-sm text-zinc-500">Loading finance…</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Log income and expenses, and set budgets by period.
        </p>
      </header>
      <div className="flex gap-2">
        {(["tx", "budgets"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === k ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          >
            {k === "tx" ? "Transactions" : "Budgets"}
          </button>
        ))}
      </div>
      {tab === "tx" ? (
        <TransactionsSection items={tx} onRefresh={load} />
      ) : (
        <BudgetsSection items={budgets} onRefresh={load} />
      )}
    </div>
  );
}

function TransactionsSection({
  items,
  onRefresh,
}: {
  items: TransactionDTO[];
  onRefresh: () => Promise<void>;
}) {
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await Planner.createTransaction({
      kind,
      amount: Number(amount),
      category: category || undefined,
    });
    if (res.success) {
      setAmount("");
      setCategory("");
      await onRefresh();
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "income" | "expense")}
          className="rounded-lg border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          type="number"
          step="0.01"
          min="0"
          className="rounded-lg border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="rounded-lg border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button type="submit" className="rounded-lg bg-zinc-900 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Save
        </button>
      </form>
      <ul className="space-y-2">
        {items.map((t) => (
          <li
            key={t.id}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span>
              <span className="font-medium capitalize">{t.kind}</span> {t.category ? `· ${t.category}` : ""}
            </span>
            <span className={t.kind === "income" ? "text-emerald-600" : "text-red-600"}>{t.amount}</span>
            <button type="button" className="text-xs text-zinc-500 hover:text-red-600" onClick={() => void delTx(t.id, onRefresh)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function delTx(id: string, onRefresh: () => Promise<void>) {
  const res = await Planner.deleteTransaction(id);
  if (res.success) await onRefresh();
}

function BudgetsSection({
  items,
  onRefresh,
}: {
  items: BudgetDTO[];
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await Planner.createBudget({
      name,
      amountLimit: Number(limit),
      periodStart: start,
      periodEnd: end,
    });
    if (res.success) {
      setName("");
      setLimit("");
      await onRefresh();
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Budget name" className="rounded-lg border px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
        <input value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Limit amount" type="number" className="rounded-lg border px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
        <input value={start} onChange={(e) => setStart(e.target.value)} type="date" className="rounded-lg border px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
        <input value={end} onChange={(e) => setEnd(e.target.value)} type="date" className="rounded-lg border px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
        <button type="submit" className="sm:col-span-2 rounded-lg bg-zinc-900 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Create budget
        </button>
      </form>
      <ul className="space-y-2">
        {items.map((b) => (
          <li key={b.id} className="flex justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="font-medium">{b.name}</span>
            <span className="text-zinc-500">{b.amountLimit}</span>
            <button type="button" className="text-xs text-red-600" onClick={() => void delBudget(b.id, onRefresh)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function delBudget(id: string, onRefresh: () => Promise<void>) {
  const res = await Planner.deleteBudget(id);
  if (res.success) await onRefresh();
}
