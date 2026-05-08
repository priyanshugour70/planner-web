"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-4 max-w-md" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log income and expenses, and set budgets by period.</p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "tx" | "budgets")}>
        <TabsList>
          <TabsTrigger value="tx">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>
        <TabsContent value="tx" className="mt-6">
          <TransactionsSection items={tx} onRefresh={load} />
        </TabsContent>
        <TabsContent value="budgets" className="mt-6">
          <BudgetsSection items={budgets} onRefresh={load} />
        </TabsContent>
      </Tabs>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log transaction</CardTitle>
          <CardDescription>Amounts are stored as you enter them.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel>Type</FieldLabel>
              <FieldContent>
                <Select value={kind} onValueChange={(v) => setKind(v as "income" | "expense")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="tx-amount">Amount</FieldLabel>
              <FieldContent>
                <Input
                  id="tx-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="tx-category">Category</FieldLabel>
              <FieldContent>
                <Input
                  id="tx-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Optional"
                />
              </FieldContent>
            </Field>
            <div className="flex items-end">
              <Button type="submit" className="w-full sm:w-auto">
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-16 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <span className="font-medium capitalize">{t.kind}</span>
                    {t.category ? <span className="text-muted-foreground"> · {t.category}</span> : null}
                  </TableCell>
                  <TableCell
                    className={
                      t.kind === "income"
                        ? "text-right font-medium text-emerald-600 dark:text-emerald-400"
                        : "text-right font-medium text-destructive"
                    }
                  >
                    {t.amount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={() => void delTx(t.id, onRefresh)} aria-label="Remove">
                      ×
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New budget</CardTitle>
          <CardDescription>Set a cap for a named period.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="budget-name">Name</FieldLabel>
              <FieldContent>
                <Input id="budget-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Budget name" />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="budget-limit">Limit amount</FieldLabel>
              <FieldContent>
                <Input
                  id="budget-limit"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="0"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="budget-start">Period start</FieldLabel>
              <FieldContent>
                <Input id="budget-start" value={start} onChange={(e) => setStart(e.target.value)} type="date" />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="budget-end">Period end</FieldLabel>
              <FieldContent>
                <Input id="budget-end" value={end} onChange={(e) => setEnd(e.target.value)} type="date" />
              </FieldContent>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Create budget</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Limit</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{b.amountLimit}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void delBudget(b.id, onRefresh)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

async function delBudget(id: string, onRefresh: () => Promise<void>) {
  const res = await Planner.deleteBudget(id);
  if (res.success) await onRefresh();
}
