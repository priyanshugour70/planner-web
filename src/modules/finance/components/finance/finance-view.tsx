"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerField } from "@/components/ui/date-picker-field";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownLeft,
  CreditCard,
  Landmark,
  Pause,
  PiggyBank,
  Play,
  Receipt,
  Repeat,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Plus,
} from "lucide-react";
import { useFinance } from "@/modules/finance/hooks/use-finance";
import type { FinanceTab } from "@/modules/finance/stores/finance-store";
import { useFinanceStore } from "@/modules/finance/stores/finance-store";
import { formatDisplayDate } from "@/lib/format-display-date";
import { formatInrAmount } from "@/lib/format-inr";
import { getLocalMonthBounds, getPreviousLocalMonthBounds } from "@/lib/local-month-bounds";
import { cn } from "@/lib/utils";
import type {
  BudgetDTO,
  BudgetRollupDTO,
  DebtObligationDTO,
  FinanceAccountDTO,
  FinanceCategoryDTO,
  RecurringRuleDTO,
  TransactionDTO,
} from "@/types/planner";

const NONE = "__none__";

function parseTags(raw: string): string[] | undefined {
  const t = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return t.length ? t : undefined;
}

function pctSpent(spent: string, limit: string): number {
  const s = Number(spent);
  const l = Number(limit);
  if (!Number.isFinite(s) || !Number.isFinite(l) || l <= 0) return 0;
  return Math.min(100, Math.round((s / l) * 100));
}

/** Budget period overlaps [from, to] inclusive (YYYY-MM-DD). */
function budgetOverlapsPeriod(
  periodStart: string | null | undefined,
  periodEnd: string | null | undefined,
  from: string,
  to: string
): boolean {
  const s = (periodStart && periodStart.length >= 10 ? periodStart : "0000-01-01").slice(0, 10);
  const e = (periodEnd && periodEnd.length >= 10 ? periodEnd : "9999-12-31").slice(0, 10);
  return s <= to && e >= from;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "default" | "emerald" | "rose" | "amber";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5",
        accent === "emerald" && "border-emerald-500/20 bg-emerald-500/[0.07] dark:border-emerald-500/25 dark:bg-emerald-500/[0.1]",
        accent === "rose" && "border-rose-500/20 bg-rose-500/[0.07] dark:border-rose-500/25 dark:bg-rose-500/[0.1]",
        accent === "amber" && "border-amber-500/25 bg-amber-500/[0.08] dark:border-amber-500/30 dark:bg-amber-500/[0.11]",
        (!accent || accent === "default") && "border-border/70 bg-card/95 backdrop-blur-sm"
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br from-primary/[0.07] to-transparent" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</div>
          {sub ? <div className="text-xs leading-snug text-muted-foreground">{sub}</div> : null}
        </div>
        <div className="shrink-0 rounded-xl border border-border/50 bg-muted/40 p-2.5">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export function FinanceView() {
  const {
    tab,
    setTab,
    intelOpen,
    setIntelOpen,
    transactions,
    budgets,
    budgetRollups,
    accounts,
    categories,
    obligations,
    recurringRules,
    summary,
    loading,
    createTx,
    updateTx,
    removeTx,
    createBudget,
    updateBudget,
    removeBudget,
    createAccount,
    updateAccount,
    deleteAccount,
    createCategory,
    updateCategory,
    deleteCategory,
    createObligation,
    updateObligation,
    deleteObligation,
    recordDebtPayment,
    createRecurringRule,
    updateRecurringRule,
    deleteRecurringRule,
    materializeRecurringDue,
    requestQuickAdd,
  } = useFinance();

  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const rollupByBudget = useMemo(() => {
    const m = new Map<string, BudgetRollupDTO>();
    for (const r of budgetRollups) m.set(r.budgetId, r);
    return m;
  }, [budgetRollups]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-3 pb-40 sm:px-5 sm:pb-44 lg:px-6">
        <div className="space-y-3 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-8">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-10 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full max-w-2xl rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-8 px-3 pb-40 sm:px-5 sm:pb-44 lg:px-6">
      <div
        className="pointer-events-none fixed inset-x-0 top-20 -z-10 mx-auto h-[22rem] max-w-3xl rounded-[3rem] bg-primary/[0.06] blur-3xl dark:bg-primary/[0.09]"
        aria-hidden
      />

      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="size-3.5 shrink-0 text-amber-500" aria-hidden />
              Finance hub
            </div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Your money, beautifully organized</h1>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Flows, budgets, accounts, and debt stay in sync across phone, tablet, and desktop — same APIs your mobile app uses.
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-6 lg:p-8">
            <Wallet className="size-12 text-primary/90 sm:size-14" aria-hidden />
          </div>
        </div>
      </header>

      <section aria-labelledby="finance-snapshot-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <h2 id="finance-snapshot-heading" className="text-sm font-semibold tracking-tight text-foreground">
            Live snapshot
          </h2>
          <Button type="button" variant="outline" size="sm" className="h-8 rounded-full text-xs" onClick={() => setIntelOpen((v) => !v)}>
            {intelOpen ? "Hide" : "Show"}
          </Button>
        </div>
        {intelOpen ? (
          summary ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={TrendingDown}
                label="Spend (MTD)"
                value={<span className="text-destructive">{formatInrAmount(summary.monthSpend)}</span>}
                sub="INR · calendar month (UTC)"
                accent="rose"
              />
              <StatCard
                icon={TrendingUp}
                label="Income (MTD)"
                value={<span className="text-emerald-600 dark:text-emerald-400">{formatInrAmount(summary.monthIncome)}</span>}
                sub="Salary, freelance, and more"
                accent="emerald"
              />
              <StatCard
                icon={PiggyBank}
                label="Open debt"
                value={summary.openDebtCount}
                sub={`Exposure ${formatInrAmount(summary.openDebtExposure)}`}
                accent="amber"
              />
              <StatCard
                icon={Target}
                label="Budgets"
                value={summary.budgetCount}
                sub={
                  summary.upcomingDebtDue7d > 0 ? (
                    <span className="text-amber-700 dark:text-amber-400">{summary.upcomingDebtDue7d} payments due ≤ 7 days</span>
                  ) : (
                    "No near-term due pressure"
                  )
                }
              />
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Analytics unavailable. Run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">pnpm db:migrate</code> and ensure
                finance migrations are applied.
              </CardContent>
            </Card>
          )
        ) : null}
      </section>

      <Tabs value={tab} onValueChange={(v) => setTab(v as FinanceTab)} className="space-y-6">
        <ScrollArea className="w-full pb-1 sm:pb-0">
          <TabsList className="inline-flex h-auto min-h-11 w-max max-w-full flex-wrap gap-1 rounded-2xl border border-border/60 bg-muted/35 p-1.5 sm:flex-nowrap">
            <TabsTrigger
              value="transactions"
              className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              <Receipt className="size-3.5 opacity-70" aria-hidden />
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="budgets"
              className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              <Landmark className="size-3.5 opacity-70" aria-hidden />
              Budgets
            </TabsTrigger>
            <TabsTrigger
              value="accounts"
              className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              <CreditCard className="size-3.5 opacity-70" aria-hidden />
              Accounts
            </TabsTrigger>
            <TabsTrigger
              value="debt"
              className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              <ArrowDownLeft className="size-3.5 opacity-70" aria-hidden />
              Debt
            </TabsTrigger>
            <TabsTrigger
              value="recurring"
              className="gap-1.5 rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              <Repeat className="size-3.5 opacity-70" aria-hidden />
              EMI & recurring
            </TabsTrigger>
          </TabsList>
        </ScrollArea>
        <TabsContent value="transactions" className="mt-6">
          <TransactionsPanel
            items={transactions}
            budgets={budgets}
            accounts={accounts}
            categories={categories}
            onCreate={createTx}
            onUpdate={updateTx}
            onRemove={removeTx}
          />
        </TabsContent>
        <TabsContent value="budgets" className="mt-6">
          <BudgetsPanel
            items={budgets}
            rollupByBudget={rollupByBudget}
            onCreate={createBudget}
            onUpdate={updateBudget}
            onRemove={removeBudget}
          />
        </TabsContent>
        <TabsContent value="accounts" className="mt-6">
          <AccountsCategoriesPanel
            accounts={accounts}
            categories={categories}
            onCreateAccount={createAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onCreateCategory={createCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />
        </TabsContent>
        <TabsContent value="debt" className="mt-6">
          <DebtPanel
            obligations={obligations}
            onCreate={createObligation}
            onUpdate={updateObligation}
            onDelete={deleteObligation}
            onPay={recordDebtPayment}
          />
        </TabsContent>
        <TabsContent value="recurring" className="mt-6">
          <RecurringPanel
            items={recurringRules}
            onCreate={createRecurringRule}
            onUpdate={updateRecurringRule}
            onDelete={deleteRecurringRule}
            onMaterialize={materializeRecurringDue}
          />
        </TabsContent>
      </Tabs>

      <Button
        type="button"
        size="icon"
        className="fixed z-50 h-14 w-14 rounded-full shadow-lg touch-manipulation right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[calc(max(1rem,env(safe-area-inset-bottom,0px))+3rem+0.75rem)] md:right-6 md:bottom-[calc(1.5rem+3rem+0.75rem)]"
        aria-label="Quick add in finance"
        onClick={() => setQuickMenuOpen(true)}
      >
        <Plus className="size-7" aria-hidden />
      </Button>

      <Dialog open={quickMenuOpen} onOpenChange={setQuickMenuOpen}>
        <DialogContent className="max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>What would you like to add?</DialogTitle>
            <DialogDescription>
              Choose a type — we will switch to the right tab and highlight the form so you can log it quickly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-1">
            <Button
              type="button"
              variant="outline"
              className="h-auto justify-start gap-2 py-3 text-left touch-manipulation"
              onClick={() => {
                setQuickMenuOpen(false);
                requestQuickAdd("transaction");
              }}
            >
              <Receipt className="size-4 shrink-0 opacity-70" aria-hidden />
              <span>
                <span className="font-medium">Log a transaction</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Income or expense you just paid or received</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto justify-start gap-2 py-3 text-left touch-manipulation"
              onClick={() => {
                setQuickMenuOpen(false);
                requestQuickAdd("budget");
              }}
            >
              <Landmark className="size-4 shrink-0 opacity-70" aria-hidden />
              <span>
                <span className="font-medium">New budget</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Cap spending for a period</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto justify-start gap-2 py-3 text-left touch-manipulation"
              onClick={() => {
                setQuickMenuOpen(false);
                requestQuickAdd("accounts");
              }}
            >
              <CreditCard className="size-4 shrink-0 opacity-70" aria-hidden />
              <span>
                <span className="font-medium">Account or category</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Structured labels and wallets</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto justify-start gap-2 py-3 text-left touch-manipulation"
              onClick={() => {
                setQuickMenuOpen(false);
                requestQuickAdd("debt");
              }}
            >
              <ArrowDownLeft className="size-4 shrink-0 opacity-70" aria-hidden />
              <span>
                <span className="font-medium">Debt or receivable</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Money you owe or someone owes you</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto justify-start gap-2 py-3 text-left touch-manipulation"
              onClick={() => {
                setQuickMenuOpen(false);
                requestQuickAdd("recurring");
              }}
            >
              <Repeat className="size-4 shrink-0 opacity-70" aria-hidden />
              <span>
                <span className="font-medium">EMI or recurring charge</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Monthly template you can materialize into transactions</span>
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionsPanel({
  items,
  budgets,
  accounts,
  categories,
  onCreate,
  onUpdate,
  onRemove,
}: {
  items: TransactionDTO[];
  budgets: BudgetDTO[];
  accounts: FinanceAccountDTO[];
  categories: FinanceCategoryDTO[];
  onCreate: (input: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}) {
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [occurredOn, setOccurredOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [budgetId, setBudgetId] = useState<string>(NONE);
  const [accountId, setAccountId] = useState<string>(NONE);
  const [categoryId, setCategoryId] = useState<string>(NONE);
  const [merchant, setMerchant] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [tags, setTags] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionDTO | null>(null);
  const [eKind, setEKind] = useState<"income" | "expense">("expense");
  const [eAmount, setEAmount] = useState("");
  const [eDate, setEDate] = useState("");
  const [eCategory, setECategory] = useState("");
  const [eNote, setENote] = useState("");
  const [eBudgetId, setEBudgetId] = useState<string>(NONE);
  const [eAccountId, setEAccountId] = useState<string>(NONE);
  const [eCategoryId, setECategoryId] = useState<string>(NONE);
  const [eMerchant, setEMerchant] = useState("");
  const [ePaymentMethod, setEPaymentMethod] = useState("");
  const [eTags, setETags] = useState("");

  const [txRange, setTxRange] = useState<"all" | "this_month" | "last_month" | "custom">("this_month");
  const [cf, setCf] = useState(() => new Date().toISOString().slice(0, 10));
  const [ct, setCt] = useState(() => new Date().toISOString().slice(0, 10));
  const [txKind, setTxKind] = useState<"all" | "income" | "expense">("all");

  const filteredItems = useMemo(() => {
    let base = items;
    if (txRange === "this_month") {
      const { from, to } = getLocalMonthBounds();
      base = base.filter((t) => t.occurredOn && t.occurredOn >= from && t.occurredOn <= to);
    } else if (txRange === "last_month") {
      const { from, to } = getPreviousLocalMonthBounds();
      base = base.filter((t) => t.occurredOn && t.occurredOn >= from && t.occurredOn <= to);
    } else if (txRange === "custom") {
      const lo = cf <= ct ? cf : ct;
      const hi = cf <= ct ? ct : cf;
      base = base.filter((t) => t.occurredOn && t.occurredOn >= lo && t.occurredOn <= hi);
    }
    if (txKind !== "all") base = base.filter((t) => t.kind === txKind);
    return base;
  }, [items, txRange, cf, ct, txKind]);

  const quickAddIntent = useFinanceStore((s) => s.quickAddIntent);
  const clearQuickAddIntent = useFinanceStore((s) => s.clearQuickAddIntent);
  useEffect(() => {
    if (quickAddIntent !== "transaction") return;
    clearQuickAddIntent();
    requestAnimationFrame(() => {
      document.getElementById("finance-tx-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("tx-amount")?.focus();
    });
  }, [quickAddIntent, clearQuickAddIntent]);

  function openEdit(t: TransactionDTO) {
    setEditing(t);
    setEKind(t.kind === "income" ? "income" : "expense");
    setEAmount(String(t.amount));
    setEDate(t.occurredOn ?? new Date().toISOString().slice(0, 10));
    setECategory(t.category ?? "");
    setENote(t.note ?? "");
    setEBudgetId(t.budgetId ?? NONE);
    setEAccountId(t.accountId ?? NONE);
    setECategoryId(t.categoryId ?? NONE);
    setEMerchant(t.merchant ?? "");
    setEPaymentMethod(t.paymentMethod ?? "");
    setETags((t.tags ?? []).join(", "));
    setEditOpen(true);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) return;
    const body: Record<string, unknown> = {
      kind,
      amount: n,
      occurredOn,
      note: note.trim() || null,
      category: category.trim() || null,
      budgetId: budgetId === NONE ? null : budgetId,
      accountId: accountId === NONE ? null : accountId,
      categoryId: categoryId === NONE ? null : categoryId,
      merchant: merchant.trim() || null,
      paymentMethod: paymentMethod.trim() || null,
    };
    const pt = parseTags(tags);
    if (pt) body.tags = pt;
    const ok = await onCreate(body);
    if (ok) {
      setAmount("");
      setCategory("");
      setNote("");
      setMerchant("");
      setPaymentMethod("");
      setTags("");
      setBudgetId(NONE);
      setAccountId(NONE);
      setCategoryId(NONE);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const n = Number(eAmount);
    if (!Number.isFinite(n) || n < 0) return;
    const body: Record<string, unknown> = {
      kind: eKind,
      amount: n,
      occurredOn: eDate,
      note: eNote.trim() || null,
      category: eCategory.trim() || null,
      budgetId: eBudgetId === NONE ? null : eBudgetId,
      accountId: eAccountId === NONE ? null : eAccountId,
      categoryId: eCategoryId === NONE ? null : eCategoryId,
      merchant: eMerchant.trim() || null,
      paymentMethod: ePaymentMethod.trim() || null,
      tags: parseTags(eTags) ?? [],
    };
    const ok = await onUpdate(editing.id, body);
    if (ok) setEditOpen(false);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["this_month", "This month"],
              ["last_month", "Last month"],
              ["all", "All dates"],
              ["custom", "Custom range"],
            ] as const
          ).map(([k, lab]) => (
            <Button
              key={k}
              type="button"
              size="sm"
              variant={txRange === k ? "default" : "outline"}
              className="touch-manipulation rounded-full"
              onClick={() => setTxRange(k)}
            >
              {lab}
            </Button>
          ))}
        </div>
        {txRange === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePickerField id="tx-f-from" label="From" value={cf} onChange={setCf} />
            <DatePickerField id="tx-f-to" label="To" value={ct} onChange={setCt} />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          {(
            [
              ["all", "All"],
              ["income", "Income"],
              ["expense", "Expense"],
            ] as const
          ).map(([k, lab]) => (
            <Button
              key={k}
              type="button"
              size="sm"
              variant={txKind === k ? "secondary" : "outline"}
              className="touch-manipulation rounded-full"
              onClick={() => setTxKind(k)}
            >
              {lab}
            </Button>
          ))}
        </div>
      </div>

      <Card id="finance-tx-form" className="border-border/70 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg">Log transaction</CardTitle>
          <CardDescription className="text-pretty">
            Rich metadata for exports, taxes, and your mobile app — same fields the API accepts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submitCreate(e)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field>
              <FieldLabel>Type</FieldLabel>
              <FieldContent>
                <Select
                  value={kind}
                  onValueChange={(v) => setKind((v ?? "expense") as "income" | "expense")}
                >
                  <SelectTrigger className="h-11 w-full sm:h-9">
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
            <DatePickerField id="tx-date" label="Date" value={occurredOn} onChange={setOccurredOn} className="sm:col-span-1" />
            <Field>
              <FieldLabel htmlFor="tx-cat">Category (free text)</FieldLabel>
              <FieldContent>
                <Input id="tx-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Optional" />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Structured category</FieldLabel>
              <FieldContent>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.kind})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Account</FieldLabel>
              <FieldContent>
                <Select value={accountId} onValueChange={(v) => setAccountId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Budget</FieldLabel>
              <FieldContent>
                <Select value={budgetId} onValueChange={(v) => setBudgetId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {budgets.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="tx-note">Note</FieldLabel>
              <FieldContent>
                <Input id="tx-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Memo" />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="tx-merchant">Merchant</FieldLabel>
              <FieldContent>
                <Input id="tx-merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="tx-pm">Payment method</FieldLabel>
              <FieldContent>
                <Input id="tx-pm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Card, UPI, …" />
              </FieldContent>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="tx-tags">Tags (comma-separated)</FieldLabel>
              <FieldContent>
                <Input id="tx-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="travel, tax-deductible" />
              </FieldContent>
            </Field>
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <Button type="submit" size="lg" className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto">
                Save transaction
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:hidden">
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">No transactions yet.</CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No transactions in this date range. Try another filter.
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((t) => {
            const acc = accounts.find((a) => a.id === t.accountId);
            const cat = categories.find((c) => c.id === t.categoryId);
            const bud = budgets.find((b) => b.id === t.budgetId);
            return (
              <Card
                key={t.id}
                className={cn(
                  "overflow-hidden shadow-sm",
                  t.kind === "income"
                    ? "border border-emerald-500/20 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.09]"
                    : "border border-destructive/20 bg-destructive/[0.05] dark:bg-destructive/[0.08]"
                )}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{formatDisplayDate(t.occurredOn)}</p>
                      <p className="mt-1 font-medium capitalize">{t.kind}</p>
                    </div>
                    <p
                      className={cn(
                        "text-lg font-semibold tabular-nums",
                        t.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                      )}
                    >
                      {formatInrAmount(t.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.category ?? cat?.name ?? "Uncategorized"}</p>
                    <p className="text-xs text-muted-foreground">
                      {[acc?.name, bud?.name, t.merchant].filter(Boolean).join(" · ") || t.note || "—"}
                    </p>
                  </div>
                  {(t.tags ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {(t.tags ?? []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" className="flex-1 touch-manipulation" onClick={() => openEdit(t)}>
                      Edit
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="flex-1 touch-manipulation text-destructive" onClick={() => void onRemove(t.id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card className="hidden border-border/70 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05] md:block">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Ledger</CardTitle>
          <CardDescription>Desktop-wide view with sortable columns.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <ScrollArea className="h-[min(28rem,58vh)] w-full rounded-b-xl">
            <div className="min-w-[640px] overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-36 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        {items.length === 0 ? "No transactions yet." : "No transactions in this date range."}
                      </TableCell>
                    </TableRow>
                  ) : (
                  filteredItems.map((t) => {
                    const acc = accounts.find((a) => a.id === t.accountId);
                    const cat = categories.find((c) => c.id === t.categoryId);
                    const bud = budgets.find((b) => b.id === t.budgetId);
                    return (
                      <TableRow
                        key={t.id}
                        className={cn(
                          "group border-b",
                          t.kind === "income"
                            ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.07] dark:bg-emerald-500/[0.06]"
                            : "bg-destructive/[0.03] hover:bg-destructive/[0.06] dark:bg-destructive/[0.05]"
                        )}
                      >
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatDisplayDate(t.occurredOn)}</TableCell>
                        <TableCell className="capitalize">{t.kind}</TableCell>
                        <TableCell>
                          <div className="font-medium">{t.category ?? cat?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {[acc?.name, bud?.name, t.merchant].filter(Boolean).join(" · ") || t.note || "—"}
                          </div>
                          {(t.tags ?? []).length > 0 ? (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {(t.tags ?? []).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] font-normal">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium tabular-nums",
                            t.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                          )}
                        >
                          {formatInrAmount(t.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEdit(t)}>
                              Edit
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void onRemove(t.id)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
            <DialogDescription>Changes sync across web and API clients.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void submitEdit(e)} className="grid gap-3">
            <Field>
              <FieldLabel>Type</FieldLabel>
              <FieldContent>
                <Select
                  value={eKind}
                  onValueChange={(v) => setEKind((v ?? "expense") as "income" | "expense")}
                >
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
              <FieldLabel>Amount</FieldLabel>
              <FieldContent>
                <Input type="number" step="0.01" min="0" value={eAmount} onChange={(e) => setEAmount(e.target.value)} />
              </FieldContent>
            </Field>
            <DatePickerField id="tx-edit-date" label="Date" value={eDate} onChange={setEDate} />
            <Field>
              <FieldLabel>Category (text)</FieldLabel>
              <FieldContent>
                <Input value={eCategory} onChange={(e) => setECategory(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Structured category</FieldLabel>
              <FieldContent>
                <Select value={eCategoryId} onValueChange={(v) => setECategoryId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Account</FieldLabel>
              <FieldContent>
                <Select value={eAccountId} onValueChange={(v) => setEAccountId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Budget</FieldLabel>
              <FieldContent>
                <Select value={eBudgetId} onValueChange={(v) => setEBudgetId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {budgets.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Note</FieldLabel>
              <FieldContent>
                <Input value={eNote} onChange={(e) => setENote(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Merchant</FieldLabel>
              <FieldContent>
                <Input value={eMerchant} onChange={(e) => setEMerchant(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Payment method</FieldLabel>
              <FieldContent>
                <Input value={ePaymentMethod} onChange={(e) => setEPaymentMethod(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Tags (comma-separated)</FieldLabel>
              <FieldContent>
                <Input value={eTags} onChange={(e) => setETags(e.target.value)} />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetsPanel({
  items,
  rollupByBudget,
  onCreate,
  onUpdate,
  onRemove,
}: {
  items: BudgetDTO[];
  rollupByBudget: Map<string, BudgetRollupDTO>;
  onCreate: (input: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [limit, setLimit] = useState("");
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetDTO | null>(null);
  const [eName, setEName] = useState("");
  const [eCategory, setECategory] = useState("");
  const [eNotes, setENotes] = useState("");
  const [eLimit, setELimit] = useState("");
  const [eStart, setEStart] = useState("");
  const [eEnd, setEEnd] = useState("");

  const [budgetRange, setBudgetRange] = useState<"all" | "this_month" | "last_month" | "custom">("all");
  const [bf, setBf] = useState(() => new Date().toISOString().slice(0, 10));
  const [bt, setBt] = useState(() => new Date().toISOString().slice(0, 10));

  const filteredBudgets = useMemo(() => {
    if (budgetRange === "all") return items;
    if (budgetRange === "this_month") {
      const { from, to } = getLocalMonthBounds();
      return items.filter((b) => budgetOverlapsPeriod(b.periodStart, b.periodEnd, from, to));
    }
    if (budgetRange === "last_month") {
      const { from, to } = getPreviousLocalMonthBounds();
      return items.filter((b) => budgetOverlapsPeriod(b.periodStart, b.periodEnd, from, to));
    }
    const lo = bf <= bt ? bf : bt;
    const hi = bf <= bt ? bt : bf;
    return items.filter((b) => budgetOverlapsPeriod(b.periodStart, b.periodEnd, lo, hi));
  }, [items, budgetRange, bf, bt]);

  const budgetQuickIntent = useFinanceStore((s) => s.quickAddIntent);
  const clearBudgetQuickIntent = useFinanceStore((s) => s.clearQuickAddIntent);
  useEffect(() => {
    if (budgetQuickIntent !== "budget") return;
    clearBudgetQuickIntent();
    requestAnimationFrame(() => {
      document.getElementById("finance-budget-add")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("b-name")?.focus();
    });
  }, [budgetQuickIntent, clearBudgetQuickIntent]);

  function openEdit(b: BudgetDTO) {
    setEditing(b);
    setEName(b.name);
    setECategory(b.category ?? "");
    setENotes(b.notes ?? "");
    setELimit(String(b.amountLimit));
    setEStart(b.periodStart ?? "");
    setEEnd(b.periodEnd ?? "");
    setEditOpen(true);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(limit);
    if (!Number.isFinite(n) || n < 0) return;
    const ok = await onCreate({
      name,
      amountLimit: n,
      periodStart: start,
      periodEnd: end,
      category: category.trim() || null,
      notes: notes.trim() || null,
    });
    if (ok) {
      setName("");
      setCategory("");
      setNotes("");
      setLimit("");
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const n = Number(eLimit);
    if (!Number.isFinite(n) || n < 0) return;
    const ok = await onUpdate(editing.id, {
      name: eName,
      amountLimit: n,
      periodStart: eStart,
      periodEnd: eEnd,
      category: eCategory.trim() || null,
      notes: eNotes.trim() || null,
    });
    if (ok) setEditOpen(false);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Filter list by period overlap</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All budgets"],
              ["this_month", "This month"],
              ["last_month", "Last month"],
              ["custom", "Custom range"],
            ] as const
          ).map(([k, lab]) => (
            <Button
              key={k}
              type="button"
              size="sm"
              variant={budgetRange === k ? "default" : "outline"}
              className="touch-manipulation rounded-full"
              onClick={() => setBudgetRange(k)}
            >
              {lab}
            </Button>
          ))}
        </div>
        {budgetRange === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <DatePickerField id="bud-f-from" label="From" value={bf} onChange={setBf} />
            <DatePickerField id="bud-f-to" label="To" value={bt} onChange={setBt} />
          </div>
        ) : null}
      </div>

      <Card id="finance-budget-add" className="border-border/70 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg">New budget</CardTitle>
          <CardDescription className="text-pretty">
            Expenses linked to this budget (by date range) feed the progress bar automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submitCreate(e)} className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="b-name">Name</FieldLabel>
              <FieldContent>
                <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="b-cat">Category label</FieldLabel>
              <FieldContent>
                <Input id="b-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Optional" />
              </FieldContent>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="b-notes">Notes</FieldLabel>
              <FieldContent>
                <Input id="b-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="b-limit">Limit</FieldLabel>
              <FieldContent>
                <Input id="b-limit" type="number" min="0" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} required />
              </FieldContent>
            </Field>
            <DatePickerField id="b-period-start" label="Period start" value={start} onChange={setStart} />
            <DatePickerField id="b-period-end" label="Period end" value={end} onChange={setEnd} />
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto">
                Create budget
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:hidden">
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">No budgets yet.</CardContent>
          </Card>
        ) : filteredBudgets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No budgets overlap this period. Try another range.
            </CardContent>
          </Card>
        ) : null}
        {filteredBudgets.map((b) => {
          const r = rollupByBudget.get(b.id);
          const spent = r?.spent ?? "0";
          const p = pctSpent(spent, b.amountLimit);
          return (
            <Card key={b.id} className="border-border/70 shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{b.name}</p>
                    {b.category ? <p className="text-xs text-muted-foreground">{b.category}</p> : null}
                  </div>
                  <Badge variant={p >= 100 ? "destructive" : "secondary"}>{p}% used</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDisplayDate(b.periodStart)} → {formatDisplayDate(b.periodEnd)}
                </p>
                <div className="text-sm tabular-nums">
                  <span className="text-muted-foreground">Spend</span>{" "}
                  <span className="font-medium">{formatInrAmount(spent)}</span>
                  <span className="text-muted-foreground"> / cap </span>
                  <span className="font-medium">{formatInrAmount(b.amountLimit)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r from-primary to-emerald-500/90 transition-all",
                      p >= 100 && "from-destructive to-destructive"
                    )}
                    style={{ width: `${p}%` }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1 touch-manipulation" onClick={() => openEdit(b)}>
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="flex-1 touch-manipulation text-destructive" onClick={() => void onRemove(b.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="hidden border-border/70 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05] lg:block">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Budget health</CardTitle>
          <CardDescription>Compare live spend against each cap.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <ScrollArea className="h-[min(24rem,50vh)] w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="min-w-[200px]">Spend / limit</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      No budgets yet.
                    </TableCell>
                  </TableRow>
                ) : filteredBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      No budgets overlap this period.
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredBudgets.map((b) => {
                  const r = rollupByBudget.get(b.id);
                  const spent = r?.spent ?? "0";
                  const p = pctSpent(spent, b.amountLimit);
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="font-medium">{b.name}</div>
                        {b.category ? <div className="text-xs text-muted-foreground">{b.category}</div> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDisplayDate(b.periodStart)} → {formatDisplayDate(b.periodEnd)}
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <div className="text-xs tabular-nums text-muted-foreground">
                          {formatInrAmount(spent)} / {formatInrAmount(b.amountLimit)}
                        </div>
                        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full bg-gradient-to-r from-primary to-emerald-500/90 transition-all",
                              p >= 100 && "from-destructive to-destructive"
                            )}
                            style={{ width: `${p}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(b)}>
                            Edit
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void onRemove(b.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit budget</DialogTitle>
            <DialogDescription>Update caps, dates, or labels.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void submitEdit(e)} className="grid gap-3">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Input value={eName} onChange={(e) => setEName(e.target.value)} required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Category label</FieldLabel>
              <FieldContent>
                <Input value={eCategory} onChange={(e) => setECategory(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <FieldContent>
                <Input value={eNotes} onChange={(e) => setENotes(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Limit</FieldLabel>
              <FieldContent>
                <Input type="number" min="0" step="0.01" value={eLimit} onChange={(e) => setELimit(e.target.value)} required />
              </FieldContent>
            </Field>
            <DatePickerField id="b-edit-start" label="Start" value={eStart} onChange={setEStart} />
            <DatePickerField id="b-edit-end" label="End" value={eEnd} onChange={setEEnd} />
            <DialogFooter>
              <Button type="submit">Save budget</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecurringPanel({
  items,
  onCreate,
  onUpdate,
  onDelete,
  onMaterialize,
}: {
  items: RecurringRuleDTO[];
  onCreate: (input: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onMaterialize: (body?: Record<string, unknown>) => Promise<boolean>;
}) {
  const [label, setLabel] = useState("");
  const [templateKind, setTemplateKind] = useState<"expense" | "income">("expense");
  const [templateAmount, setTemplateAmount] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [nextRunOn, setNextRunOn] = useState(() => new Date().toISOString().slice(0, 10));

  const recurringQuickIntent = useFinanceStore((s) => s.quickAddIntent);
  const clearRecurringQuickIntent = useFinanceStore((s) => s.clearQuickAddIntent);
  useEffect(() => {
    if (recurringQuickIntent !== "recurring") return;
    clearRecurringQuickIntent();
    requestAnimationFrame(() => {
      document.getElementById("finance-recurring-add")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("finance-quick-recurring-label")?.focus();
    });
  }, [recurringQuickIntent, clearRecurringQuickIntent]);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onCreate({
      label: label.trim(),
      templateKind,
      templateAmount,
      templateCategory: templateCategory.trim() || null,
      cadence: "monthly",
      nextRunOn,
      active: true,
    });
    if (ok) {
      setLabel("");
      setTemplateKind("expense");
      setTemplateAmount("");
      setTemplateCategory("");
      setNextRunOn(new Date().toISOString().slice(0, 10));
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Monthly templates become real transactions when you run Materialize due (through today, UTC), matching the mobile app.
        </p>
        <Button type="button" variant="secondary" className="touch-manipulation" onClick={() => void onMaterialize({})}>
          Materialize due (through today)
        </Button>
      </div>

      <Card id="finance-recurring-add" className="border-border/70 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">New recurring / EMI</CardTitle>
          <CardDescription className="text-pretty">Rent, loan EMI, salary, or any fixed monthly amount.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submitCreate(e)} className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel>Label</FieldLabel>
              <FieldContent>
                <Input
                  id="finance-quick-recurring-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Home loan EMI"
                  required
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <FieldContent>
                <Select value={templateKind} onValueChange={(v) => setTemplateKind(v === "income" ? "income" : "expense")}>
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
              <FieldLabel>Amount</FieldLabel>
              <FieldContent>
                <Input type="number" min="0" step="0.01" value={templateAmount} onChange={(e) => setTemplateAmount(e.target.value)} required />
              </FieldContent>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Category label (optional)</FieldLabel>
              <FieldContent>
                <Input value={templateCategory} onChange={(e) => setTemplateCategory(e.target.value)} placeholder="Housing, salary…" />
              </FieldContent>
            </Field>
            <Field className="sm:col-span-2">
              <DatePickerField id="recurring-next-run" label="Next run" value={nextRunOn} onChange={setNextRunOn} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto">
                Save rule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:hidden">
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">No recurring rules yet.</CardContent>
          </Card>
        ) : null}
        {items.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "overflow-hidden shadow-sm",
              item.templateKind === "income"
                ? "border border-emerald-500/20 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.09]"
                : "border border-rose-500/20 bg-rose-500/[0.06] dark:bg-rose-500/[0.09]"
            )}
          >
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{item.label}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {item.templateKind} · {item.cadence}
                  </p>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-primary">{formatInrAmount(item.templateAmount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Next run {formatDisplayDate(item.nextRunOn)}
                    {item.active ? "" : " · paused"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 touch-manipulation"
                  aria-label={item.active ? "Pause rule" : "Resume rule"}
                  onClick={() => void onUpdate(item.id, { active: !item.active })}
                >
                  {item.active ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
                </Button>
              </div>
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void onDelete(item.id)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden border-border/70 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05] md:block">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Rules</CardTitle>
          <CardDescription>Toggle pause without losing history. Materialize posts due items through today.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <ScrollArea className="h-[min(22rem,50vh)] w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Label</TableHead>
                  <TableHead className="w-24">Kind</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-36">Next run</TableHead>
                  <TableHead className="w-28">Active</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No recurring rules yet.
                    </TableCell>
                  </TableRow>
                ) : null}
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="capitalize">{item.templateKind}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatInrAmount(item.templateAmount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDisplayDate(item.nextRunOn)}</TableCell>
                    <TableCell>{item.active ? "Yes" : "Paused"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => void onUpdate(item.id, { active: !item.active })}>
                          {item.active ? "Pause" : "Resume"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void onDelete(item.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function accountKindIcon(kind: string): ComponentType<{ className?: string; "aria-hidden"?: boolean }> {
  if (kind === "credit") return CreditCard;
  if (kind === "savings") return PiggyBank;
  if (kind === "cash") return Wallet;
  if (kind === "investment") return TrendingUp;
  return Landmark;
}

function AccountsCategoriesPanel({
  accounts,
  categories,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: {
  accounts: FinanceAccountDTO[];
  categories: FinanceCategoryDTO[];
  onCreateAccount: (input: Record<string, unknown>) => Promise<boolean>;
  onUpdateAccount: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  onDeleteAccount: (id: string) => Promise<boolean>;
  onCreateCategory: (input: Record<string, unknown>) => Promise<boolean>;
  onUpdateCategory: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  onDeleteCategory: (id: string) => Promise<boolean>;
}) {
  const [accName, setAccName] = useState("");
  const [accKind, setAccKind] = useState("checking");
  const [catName, setCatName] = useState("");
  const [catKind, setCatKind] = useState("expense");
  const [parentId, setParentId] = useState<string>(NONE);

  const [editAccount, setEditAccount] = useState<FinanceAccountDTO | null>(null);
  const [eaName, setEaName] = useState("");
  const [eaKind, setEaKind] = useState("checking");
  const [editCategory, setEditCategory] = useState<FinanceCategoryDTO | null>(null);
  const [ecName, setEcName] = useState("");
  const [ecKind, setEcKind] = useState("expense");
  const [ecParentId, setEcParentId] = useState<string>(NONE);

  const [accQuery, setAccQuery] = useState("");
  const [catQuery, setCatQuery] = useState("");
  const [catKindFilter, setCatKindFilter] = useState<"all" | "income" | "expense" | "both">("all");

  const filteredAccounts = useMemo(() => {
    const q = accQuery.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) => a.name.toLowerCase().includes(q));
  }, [accounts, accQuery]);

  const filteredCategories = useMemo(() => {
    let rows = categories;
    if (catKindFilter !== "all") rows = rows.filter((c) => c.kind === catKindFilter);
    const q = catQuery.trim().toLowerCase();
    if (q) rows = rows.filter((c) => c.name.toLowerCase().includes(q));
    return rows;
  }, [categories, catKindFilter, catQuery]);

  const accountsQuickIntent = useFinanceStore((s) => s.quickAddIntent);
  const clearAccountsQuickIntent = useFinanceStore((s) => s.clearQuickAddIntent);
  useEffect(() => {
    if (accountsQuickIntent !== "accounts") return;
    clearAccountsQuickIntent();
    requestAnimationFrame(() => {
      document.getElementById("finance-accounts-add")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("finance-quick-acc-name")?.focus();
    });
  }, [accountsQuickIntent, clearAccountsQuickIntent]);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <Card id="finance-accounts-add" className="border-border/70 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Accounts</CardTitle>
          <CardDescription className="text-pretty">Where money lives — attach these on every transaction.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                const ok = await onCreateAccount({ name: accName.trim(), kind: accKind, currency: "INR" });
                if (ok) setAccName("");
              })();
            }}
          >
            <Field className="sm:col-span-2">
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Input id="finance-quick-acc-name" value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Main checking" required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Kind</FieldLabel>
              <FieldContent>
                <Select value={accKind} onValueChange={(v) => setAccKind(v ?? "checking")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <div className="flex items-end">
              <Button type="submit" size="lg" className="h-11 w-full touch-manipulation sm:h-9">
                Add account
              </Button>
            </div>
          </form>
          <Separator />
          <Field>
            <FieldLabel htmlFor="acc-filter">Search accounts</FieldLabel>
            <FieldContent>
              <Input id="acc-filter" value={accQuery} onChange={(e) => setAccQuery(e.target.value)} placeholder="Filter by name…" />
            </FieldContent>
          </Field>
          <ScrollArea className="h-[min(18rem,42vh)] w-full rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Account</TableHead>
                  <TableHead className="w-28">Kind</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      No accounts yet.
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      No accounts match this search.
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredAccounts.map((a) => {
                  const Icon = accountKindIcon(a.kind);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-muted/80">
                            <Icon className="size-4 text-muted-foreground" aria-hidden />
                          </span>
                          <span className="font-medium">{a.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal capitalize">
                          {a.kind}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditAccount(a);
                              setEaName(a.name);
                              setEaKind(a.kind);
                            }}
                          >
                            Edit
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void onDeleteAccount(a.id)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Categories</CardTitle>
          <CardDescription className="text-pretty">Structured labels with optional parent for nested reporting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                const ok = await onCreateCategory({
                  name: catName.trim(),
                  kind: catKind,
                  parentId: parentId === NONE ? null : parentId,
                });
                if (ok) {
                  setCatName("");
                  setParentId(NONE);
                }
              })();
            }}
          >
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Input value={catName} onChange={(e) => setCatName(e.target.value)} required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Kind</FieldLabel>
              <FieldContent>
                <Select value={catKind} onValueChange={(v) => setCatKind(v ?? "expense")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Parent</FieldLabel>
              <FieldContent>
                <Select value={parentId} onValueChange={(v) => setParentId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Button type="submit" size="lg" className="h-11 w-full touch-manipulation sm:h-9">
              Add category
            </Button>
          </form>
          <Separator />
          <div className="space-y-3">
            <Field>
              <FieldLabel htmlFor="cat-filter">Search categories</FieldLabel>
              <FieldContent>
                <Input id="cat-filter" value={catQuery} onChange={(e) => setCatQuery(e.target.value)} placeholder="Filter by name…" />
              </FieldContent>
            </Field>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All kinds"],
                  ["expense", "Expense"],
                  ["income", "Income"],
                  ["both", "Both"],
                ] as const
              ).map(([k, lab]) => (
                <Button
                  key={k}
                  type="button"
                  size="sm"
                  variant={catKindFilter === k ? "secondary" : "outline"}
                  className="touch-manipulation rounded-full capitalize"
                  onClick={() => setCatKindFilter(k)}
                >
                  {lab}
                </Button>
              ))}
            </div>
          </div>
          <ScrollArea className="h-[min(18rem,42vh)] w-full rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead className="w-28">Kind</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      No categories yet.
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      No categories match these filters.
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredCategories.map((c) => (
                  <TableRow
                    key={c.id}
                    className={cn(
                      c.kind === "income" && "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]",
                      c.kind === "expense" && "bg-rose-500/[0.04] dark:bg-rose-500/[0.06]",
                      c.kind === "both" && "bg-primary/[0.04] dark:bg-primary/[0.06]"
                    )}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal capitalize">
                        {c.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditCategory(c);
                            setEcName(c.name);
                            setEcKind(c.kind);
                            setEcParentId(c.parentId ?? NONE);
                          }}
                        >
                          Edit
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void onDeleteCategory(c.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      </div>

      <Dialog
        open={editAccount !== null}
        onOpenChange={(open) => {
          if (!open) setEditAccount(null);
        }}
      >
        <DialogContent className="max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit account</DialogTitle>
            <DialogDescription>Update how this wallet appears on transactions.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                if (!editAccount) return;
                const ok = await onUpdateAccount(editAccount.id, { name: eaName.trim(), kind: eaKind });
                if (ok) setEditAccount(null);
              })();
            }}
          >
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Input value={eaName} onChange={(e) => setEaName(e.target.value)} required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Kind</FieldLabel>
              <FieldContent>
                <Select value={eaKind} onValueChange={(v) => setEaKind(v ?? "checking")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editCategory !== null}
        onOpenChange={(open) => {
          if (!open) setEditCategory(null);
        }}
      >
        <DialogContent className="max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>Rename, change kind, or nest under another category.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                if (!editCategory) return;
                const ok = await onUpdateCategory(editCategory.id, {
                  name: ecName.trim(),
                  kind: ecKind,
                  parentId: ecParentId === NONE ? null : ecParentId,
                });
                if (ok) setEditCategory(null);
              })();
            }}
          >
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Input value={ecName} onChange={(e) => setEcName(e.target.value)} required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Kind</FieldLabel>
              <FieldContent>
                <Select value={ecKind} onValueChange={(v) => setEcKind(v ?? "expense")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Parent</FieldLabel>
              <FieldContent>
                <Select value={ecParentId} onValueChange={(v) => setEcParentId(v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value={NONE}>None</SelectItem>
                    {categories
                      .filter((x) => x.id !== editCategory?.id)
                      .map((x) => (
                        <SelectItem key={x.id} value={x.id}>
                          {x.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DebtPanel({
  obligations,
  onCreate,
  onUpdate,
  onDelete,
  onPay,
}: {
  obligations: DebtObligationDTO[];
  onCreate: (input: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (id: string, input: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onPay: (obligationId: string, amount: number, note?: string) => Promise<boolean>;
}) {
  const [counterparty, setCounterparty] = useState("");
  const [direction, setDirection] = useState("owed");
  const [principal, setPrincipal] = useState("");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");

  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<DebtObligationDTO | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DebtObligationDTO | null>(null);
  const [editStatus, setEditStatus] = useState("open");
  const [editNotes, setEditNotes] = useState("");

  const [debtDir, setDebtDir] = useState<"all" | "lent" | "owed">("all");
  const [debtStatus, setDebtStatus] = useState<"all" | "open" | "closed">("all");
  const [debtDueFrom, setDebtDueFrom] = useState("");
  const [debtDueTo, setDebtDueTo] = useState("");

  const filteredObligations = useMemo(() => {
    return obligations.filter((o) => {
      if (debtDir !== "all" && o.direction !== debtDir) return false;
      if (debtStatus !== "all" && o.status !== debtStatus) return false;
      const d = o.dueDate && o.dueDate.length >= 10 ? o.dueDate.slice(0, 10) : "";
      if (debtDueFrom && (!d || d < debtDueFrom)) return false;
      if (debtDueTo && (!d || d > debtDueTo)) return false;
      return true;
    });
  }, [obligations, debtDir, debtStatus, debtDueFrom, debtDueTo]);

  const debtQuickIntent = useFinanceStore((s) => s.quickAddIntent);
  const clearDebtQuickIntent = useFinanceStore((s) => s.clearQuickAddIntent);
  useEffect(() => {
    if (debtQuickIntent !== "debt") return;
    clearDebtQuickIntent();
    requestAnimationFrame(() => {
      document.getElementById("finance-debt-add")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("finance-quick-debt-counterparty")?.focus();
    });
  }, [debtQuickIntent, clearDebtQuickIntent]);

  function openPay(o: DebtObligationDTO) {
    setPayTarget(o);
    setPayAmount("");
    setPayNote("");
    setPayOpen(true);
  }

  function openEditObligation(o: DebtObligationDTO) {
    setEditTarget(o);
    setEditStatus(o.status);
    setEditNotes(o.notes ?? "");
    setEditOpen(true);
  }

  async function submitEditObligation(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    const ok = await onUpdate(editTarget.id, { status: editStatus, notes: editNotes.trim() || null });
    if (ok) setEditOpen(false);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const p = Number(principal);
    if (!Number.isFinite(p) || p < 0) return;
    const ok = await onCreate({
      counterparty: counterparty.trim(),
      direction,
      principal: p,
      dueDate: due.trim() || null,
      notes: notes.trim() || null,
    });
    if (ok) {
      setCounterparty("");
      setPrincipal("");
      setDue("");
      setNotes("");
    }
  }

  async function submitPay(e: React.FormEvent) {
    e.preventDefault();
    if (!payTarget) return;
    const n = Number(payAmount);
    if (!Number.isFinite(n) || n <= 0) return;
    const ok = await onPay(payTarget.id, n, payNote.trim() || undefined);
    if (ok) setPayOpen(false);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Filter obligations</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All directions"],
              ["owed", "Owed"],
              ["lent", "Lent"],
            ] as const
          ).map(([k, lab]) => (
            <Button
              key={k}
              type="button"
              size="sm"
              variant={debtDir === k ? "default" : "outline"}
              className="touch-manipulation rounded-full capitalize"
              onClick={() => setDebtDir(k)}
            >
              {lab}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All statuses"],
              ["open", "Open"],
              ["closed", "Closed"],
            ] as const
          ).map(([k, lab]) => (
            <Button
              key={k}
              type="button"
              size="sm"
              variant={debtStatus === k ? "secondary" : "outline"}
              className="touch-manipulation rounded-full capitalize"
              onClick={() => setDebtStatus(k)}
            >
              {lab}
            </Button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="debt-due-from">Due on or after</FieldLabel>
            <FieldContent>
              <Input id="debt-due-from" type="date" value={debtDueFrom} onChange={(e) => setDebtDueFrom(e.target.value)} className="h-11 sm:h-9" />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="debt-due-to">Due on or before</FieldLabel>
            <FieldContent>
              <Input id="debt-due-to" type="date" value={debtDueTo} onChange={(e) => setDebtDueTo(e.target.value)} className="h-11 sm:h-9" />
            </FieldContent>
          </Field>
        </div>
        <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={() => { setDebtDueFrom(""); setDebtDueTo(""); }}>
          Clear due-date filter
        </Button>
      </div>

      <Card id="finance-debt-add" className="border-border/70 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Add debt or receivable</CardTitle>
          <CardDescription className="text-pretty">
            <span className="font-medium text-foreground">owed</span> — you repay someone.{" "}
            <span className="font-medium text-foreground">lent</span> — someone repays you. Starting balance matches principal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submitCreate(e)} className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel>Counterparty</FieldLabel>
              <FieldContent>
                <Input
                  id="finance-quick-debt-counterparty"
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  placeholder="Bank, friend, …"
                  required
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Direction</FieldLabel>
              <FieldContent>
                <Select value={direction} onValueChange={(v) => setDirection(v ?? "owed")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value="owed">owed</SelectItem>
                    <SelectItem value="lent">lent</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Principal / starting balance</FieldLabel>
              <FieldContent>
                <Input type="number" min="0" step="0.01" value={principal} onChange={(e) => setPrincipal(e.target.value)} required />
              </FieldContent>
            </Field>
            {due.length >= 10 ? (
              <div className="space-y-2 sm:col-span-2">
                <DatePickerField id="debt-create-due" label="Due date (optional)" value={due} onChange={setDue} />
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setDue("")}>
                  Remove due date
                </Button>
              </div>
            ) : (
              <Field className="sm:col-span-2">
                <FieldLabel>Due date (optional)</FieldLabel>
                <FieldContent>
                  <Button type="button" variant="outline" className="h-11 w-full touch-manipulation justify-start font-normal sm:h-9" onClick={() => setDue(new Date().toISOString().slice(0, 10))}>
                    Tap to add a due date
                  </Button>
                </FieldContent>
              </Field>
            )}
            <Field className="sm:col-span-2">
              <FieldLabel>Notes</FieldLabel>
              <FieldContent>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </FieldContent>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto">
                Save obligation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:hidden">
        {obligations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">No obligations yet.</CardContent>
          </Card>
        ) : filteredObligations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">Nothing matches these filters.</CardContent>
          </Card>
        ) : null}
        {filteredObligations.map((o) => (
          <Card
            key={o.id}
            className={cn(
              "overflow-hidden shadow-sm",
              o.direction === "lent"
                ? "border border-emerald-500/20 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.09]"
                : "border border-rose-500/20 bg-rose-500/[0.06] dark:bg-rose-500/[0.09]"
            )}
          >
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold leading-snug">{o.counterparty}</p>
                  <Badge variant="outline" className="mt-2 capitalize">
                    {o.direction}
                  </Badge>
                </div>
                <p className="text-lg font-semibold tabular-nums">{formatInrAmount(o.balance)}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Due {formatDisplayDate(o.dueDate)}</span>
                <span>·</span>
                <span className="capitalize">{o.status}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="min-w-0 flex-1 touch-manipulation" disabled={o.status === "closed"} onClick={() => openPay(o)}>
                  Pay
                </Button>
                <Button type="button" variant="outline" size="sm" className="min-w-0 flex-1 touch-manipulation" onClick={() => openEditObligation(o)}>
                  Edit
                </Button>
                <Button type="button" variant="ghost" size="sm" className="min-w-0 flex-1 touch-manipulation text-destructive" onClick={() => void onDelete(o.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden border-border/70 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05] md:block">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Obligations</CardTitle>
          <CardDescription>Balances shown are live from your ledger.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <ScrollArea className="h-[min(22rem,50vh)] w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Counterparty</TableHead>
                  <TableHead className="w-24">Dir</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-32">Due</TableHead>
                  <TableHead className="w-52 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obligations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No obligations yet.
                    </TableCell>
                  </TableRow>
                ) : filteredObligations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Nothing matches these filters.
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredObligations.map((o) => (
                  <TableRow
                    key={o.id}
                    className={cn(
                      o.direction === "lent"
                        ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.07] dark:bg-emerald-500/[0.06]"
                        : "bg-rose-500/[0.04] hover:bg-rose-500/[0.07] dark:bg-rose-500/[0.06]"
                    )}
                  >
                    <TableCell className="font-medium">{o.counterparty}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal capitalize">
                        {o.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatInrAmount(o.balance)}</TableCell>
                    <TableCell className="capitalize">{o.status}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDisplayDate(o.dueDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button type="button" variant="outline" size="sm" disabled={o.status === "closed"} onClick={() => openPay(o)}>
                          Pay
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => openEditObligation(o)}>
                          Edit
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void onDelete(o.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit obligation</DialogTitle>
            <DialogDescription>
              {editTarget ? `Update status or notes for ${editTarget.counterparty}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void submitEditObligation(e)} className="grid gap-3">
            <Field>
              <FieldLabel>Status</FieldLabel>
              <FieldContent>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v ?? "open")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <FieldContent>
                <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {payTarget ? `Toward ${payTarget.counterparty} · balance ${formatInrAmount(payTarget.balance)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void submitPay(e)} className="grid gap-3">
            <Field>
              <FieldLabel>Amount</FieldLabel>
              <FieldContent>
                <Input type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Note</FieldLabel>
              <FieldContent>
                <Input value={payNote} onChange={(e) => setPayNote(e.target.value)} />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit">Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
