"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
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
  PiggyBank,
  Receipt,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useFinance } from "@/modules/finance/hooks/use-finance";
import type { FinanceTab } from "@/modules/finance/stores/finance-store";
import { formatInrAmount } from "@/lib/format-inr";
import { cn } from "@/lib/utils";
import type {
  BudgetDTO,
  BudgetRollupDTO,
  DebtObligationDTO,
  FinanceAccountDTO,
  FinanceCategoryDTO,
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
  const accentRing =
    accent === "emerald"
      ? "ring-emerald-500/15"
      : accent === "rose"
        ? "ring-rose-500/15"
        : accent === "amber"
          ? "ring-amber-500/20"
          : "ring-primary/10";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm ring-1 backdrop-blur-sm transition-shadow hover:shadow-md sm:p-5",
        accentRing
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent" />
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
    summary,
    loading,
    createTx,
    updateTx,
    removeTx,
    createBudget,
    updateBudget,
    removeBudget,
    createAccount,
    deleteAccount,
    createCategory,
    deleteCategory,
    createObligation,
    deleteObligation,
    recordDebtPayment,
  } = useFinance();

  const rollupByBudget = useMemo(() => {
    const m = new Map<string, BudgetRollupDTO>();
    for (const r of budgetRollups) m.set(r.budgetId, r);
    return m;
  }, [budgetRollups]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-3 pb-16 sm:px-5 lg:px-6">
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
    <div className="relative mx-auto max-w-6xl space-y-8 px-3 pb-24 sm:px-5 lg:px-6">
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
            onDeleteAccount={deleteAccount}
            onCreateCategory={createCategory}
            onDeleteCategory={deleteCategory}
          />
        </TabsContent>
        <TabsContent value="debt" className="mt-6">
          <DebtPanel
            obligations={obligations}
            onCreate={createObligation}
            onDelete={deleteObligation}
            onPay={recordDebtPayment}
          />
        </TabsContent>
      </Tabs>
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
      <Card className="border-border/70 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
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
            <Field>
              <FieldLabel htmlFor="tx-date">Date</FieldLabel>
              <FieldContent>
                <Input id="tx-date" type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} />
              </FieldContent>
            </Field>
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
        ) : (
          items.map((t) => {
            const acc = accounts.find((a) => a.id === t.accountId);
            const cat = categories.find((c) => c.id === t.categoryId);
            const bud = budgets.find((b) => b.id === t.budgetId);
            return (
              <Card key={t.id} className="overflow-hidden border-border/70 shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{t.occurredOn ?? "—"}</p>
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
                  {items.map((t) => {
                    const acc = accounts.find((a) => a.id === t.accountId);
                    const cat = categories.find((c) => c.id === t.categoryId);
                    const bud = budgets.find((b) => b.id === t.budgetId);
                    return (
                      <TableRow key={t.id} className="group">
                        <TableCell className="whitespace-nowrap text-muted-foreground">{t.occurredOn ?? "—"}</TableCell>
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
                  })}
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
            <Field>
              <FieldLabel>Date</FieldLabel>
              <FieldContent>
                <Input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} />
              </FieldContent>
            </Field>
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
      <Card className="border-border/70 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
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
            <Field>
              <FieldLabel htmlFor="b-start">Period start</FieldLabel>
              <FieldContent>
                <Input id="b-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="b-end">Period end</FieldLabel>
              <FieldContent>
                <Input id="b-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
              </FieldContent>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto">
                Create budget
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:hidden">
        {items.map((b) => {
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
                  {b.periodStart ?? "—"} → {b.periodEnd ?? "—"}
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
                {items.map((b) => {
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
                        {b.periodStart ?? "—"} → {b.periodEnd ?? "—"}
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
            <Field>
              <FieldLabel>Start</FieldLabel>
              <FieldContent>
                <Input type="date" value={eStart} onChange={(e) => setEStart(e.target.value)} required />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>End</FieldLabel>
              <FieldContent>
                <Input type="date" value={eEnd} onChange={(e) => setEEnd(e.target.value)} required />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button type="submit">Save budget</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
  onDeleteAccount,
  onCreateCategory,
  onDeleteCategory,
}: {
  accounts: FinanceAccountDTO[];
  categories: FinanceCategoryDTO[];
  onCreateAccount: (input: Record<string, unknown>) => Promise<boolean>;
  onDeleteAccount: (id: string) => Promise<boolean>;
  onCreateCategory: (input: Record<string, unknown>) => Promise<boolean>;
  onDeleteCategory: (id: string) => Promise<boolean>;
}) {
  const [accName, setAccName] = useState("");
  const [accKind, setAccKind] = useState("checking");
  const [catName, setCatName] = useState("");
  const [catKind, setCatKind] = useState("expense");
  const [parentId, setParentId] = useState<string>(NONE);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <Card className="border-border/70 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
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
                <Input value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Main checking" required />
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
          <ScrollArea className="h-[min(18rem,42vh)] w-full rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Account</TableHead>
                  <TableHead className="w-28">Kind</TableHead>
                  <TableHead className="w-24 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => {
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
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void onDeleteAccount(a.id)}>
                          Delete
                        </Button>
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
          <ScrollArea className="h-[min(18rem,42vh)] w-full rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead className="w-28">Kind</TableHead>
                  <TableHead className="w-24 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal capitalize">
                        {c.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void onDeleteCategory(c.id)}>
                        Delete
                      </Button>
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

function DebtPanel({
  obligations,
  onCreate,
  onDelete,
  onPay,
}: {
  obligations: DebtObligationDTO[];
  onCreate: (input: Record<string, unknown>) => Promise<boolean>;
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

  function openPay(o: DebtObligationDTO) {
    setPayTarget(o);
    setPayAmount("");
    setPayNote("");
    setPayOpen(true);
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
      <Card className="border-border/70 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
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
                <Input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Bank, friend, …" required />
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
            <Field>
              <FieldLabel>Due date</FieldLabel>
              <FieldContent>
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </FieldContent>
            </Field>
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
        {obligations.map((o) => (
          <Card key={o.id} className="overflow-hidden border-border/70 shadow-sm">
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
                <span>Due {o.dueDate ?? "—"}</span>
                <span>·</span>
                <span className="capitalize">{o.status}</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 touch-manipulation" disabled={o.status === "closed"} onClick={() => openPay(o)}>
                  Pay
                </Button>
                <Button type="button" variant="ghost" size="sm" className="flex-1 touch-manipulation text-destructive" onClick={() => void onDelete(o.id)}>
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
                  <TableHead className="w-44 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obligations.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.counterparty}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal capitalize">
                        {o.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatInrAmount(o.balance)}</TableCell>
                    <TableCell className="capitalize">{o.status}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{o.dueDate ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="outline" size="sm" disabled={o.status === "closed"} onClick={() => openPay(o)}>
                          Pay
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
