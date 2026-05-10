/**
 * Seeds rich finance demo data for a single user (accounts, categories, budgets,
 * transactions, debt). Safe to re-run with --force (wipes that user's finance rows first).
 *
 * Usage:
 *   pnpm db:seed:finance
 *   SEED_FINANCE_EMAIL=you@example.com pnpm db:seed:finance --force
 *
 * For finance + tasks in one go: `pnpm db:seed` (see scripts/seed-all.ts).
 */
import { config } from "dotenv";
import path from "node:path";
import postgres from "postgres";
import { resolveDatabaseUrl } from "../src/lib/db-url";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sql = postgres.Sql<any>;

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const DEFAULT_EMAIL = "priyanshugour1@gmail.com";

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const email = (process.env.SEED_FINANCE_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
  const force = process.argv.includes("--force");
  const url = resolveDatabaseUrl();
  const sql = postgres(url, { max: 1, prepare: false, ssl: "require" }) as Sql;

  const [user] = await sql<{ id: bigint }[]>`SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1`;
  if (!user) {
    console.error(`No user with email "${email}". Sign up first, then re-run.`);
    process.exit(1);
  }
  const uid = user.id;

  if (force) {
    console.log(`Removing existing finance data for user ${uid}…`);
    await sql`DELETE FROM debt_payments WHERE obligation_id IN (SELECT id FROM debt_obligations WHERE user_id = ${uid})`;
    await sql`DELETE FROM debt_obligations WHERE user_id = ${uid}`;
    await sql`DELETE FROM transactions WHERE user_id = ${uid}`;
    await sql`DELETE FROM budgets WHERE user_id = ${uid}`;
    await sql`DELETE FROM finance_categories WHERE user_id = ${uid}`;
    await sql`DELETE FROM finance_accounts WHERE user_id = ${uid}`;
  } else {
    const [{ c }] = await sql<{ c: number }[]>`
      SELECT COUNT(*)::int AS c FROM transactions WHERE user_id = ${uid}
    `;
    if (c > 20) {
      console.log(
        `User already has ${c} transactions. Re-run with --force to replace demo finance data.`
      );
      await sql.end();
      return;
    }
  }

  console.log(`Seeding finance demo for ${email} (user_id=${uid})…`);

  const [accMain] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_accounts (user_id, name, kind, currency)
    VALUES (${uid}, 'Primary Checking', 'checking', 'INR') RETURNING id
  `;
  const [accSave] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_accounts (user_id, name, kind, currency)
    VALUES (${uid}, 'High-Yield Savings', 'savings', 'INR') RETURNING id
  `;
  const [accCash] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_accounts (user_id, name, kind, currency)
    VALUES (${uid}, 'Cash Wallet', 'cash', 'INR') RETURNING id
  `;
  const [accCard] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_accounts (user_id, name, kind, currency)
    VALUES (${uid}, 'Visa Signature', 'credit', 'INR') RETURNING id
  `;

  const [catFood] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_categories (user_id, name, kind, parent_id)
    VALUES (${uid}, 'Food & dining', 'expense', NULL) RETURNING id
  `;
  const [catGroceries] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_categories (user_id, name, kind, parent_id)
    VALUES (${uid}, 'Groceries', 'expense', ${catFood!.id}) RETURNING id
  `;
  const [catDining] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_categories (user_id, name, kind, parent_id)
    VALUES (${uid}, 'Restaurants', 'expense', ${catFood!.id}) RETURNING id
  `;
  const [catHome] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_categories (user_id, name, kind, parent_id)
    VALUES (${uid}, 'Home', 'expense', NULL) RETURNING id
  `;
  const [catTransport] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_categories (user_id, name, kind, parent_id)
    VALUES (${uid}, 'Transport', 'expense', NULL) RETURNING id
  `;
  const [catHealth] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_categories (user_id, name, kind, parent_id)
    VALUES (${uid}, 'Health', 'expense', NULL) RETURNING id
  `;
  const [catEnt] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_categories (user_id, name, kind, parent_id)
    VALUES (${uid}, 'Entertainment', 'expense', NULL) RETURNING id
  `;
  const [catIncome] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_categories (user_id, name, kind, parent_id)
    VALUES (${uid}, 'Salary & bonus', 'income', NULL) RETURNING id
  `;
  const [catFreelance] = await sql<{ id: bigint }[]>`
    INSERT INTO finance_categories (user_id, name, kind, parent_id)
    VALUES (${uid}, 'Freelance', 'income', NULL) RETURNING id
  `;

  const periodStart = daysAgo(30);
  const periodEnd = daysAgo(-35);

  const [budLife] = await sql<{ id: bigint }[]>`
    INSERT INTO budgets (user_id, name, category, amount_limit, period_start, period_end, notes)
    VALUES (
      ${uid},
      'Monthly life',
      'general',
      4200.00,
      ${periodStart}::date,
      ${periodEnd}::date,
      'Rent, groceries, subscriptions — demo cap.'
    ) RETURNING id
  `;
  const [budFood] = await sql<{ id: bigint }[]>`
    INSERT INTO budgets (user_id, name, category, amount_limit, period_start, period_end, notes)
    VALUES (
      ${uid},
      'Food & dining',
      'food',
      950.00,
      ${periodStart}::date,
      ${periodEnd}::date,
      'Groceries + restaurants combined.'
    ) RETURNING id
  `;
  const [budTravel] = await sql<{ id: bigint }[]>`
    INSERT INTO budgets (user_id, name, category, amount_limit, period_start, period_end, notes)
    VALUES (
      ${uid},
      'Travel fund',
      'travel',
      600.00,
      ${periodStart}::date,
      ${periodEnd}::date,
      'Flights, hotels, local transport on trips.'
    ) RETURNING id
  `;

  type Tx = {
    kind: "income" | "expense";
    amount: string;
    days: number;
    category: string | null;
    note: string | null;
    budgetId: bigint | null;
    accountId: bigint | null;
    categoryId: bigint | null;
    merchant: string | null;
    paymentMethod: string | null;
    tags: string[];
  };

  const txs: Tx[] = [
    { kind: "income", amount: "8420.00", days: 28, category: null, note: "Salary — Acme Corp", budgetId: null, accountId: accMain!.id, categoryId: catIncome!.id, merchant: null, paymentMethod: "ACH", tags: ["salary", "monthly"] },
    { kind: "income", amount: "1200.00", days: 26, category: null, note: "Freelance — UI audit", budgetId: null, accountId: accMain!.id, categoryId: catFreelance!.id, merchant: "Northwind Labs", paymentMethod: "Wire", tags: ["freelance"] },
    { kind: "income", amount: "350.00", days: 12, category: null, note: "Cashback rewards", budgetId: null, accountId: accCard!.id, categoryId: null, merchant: "Card issuer", paymentMethod: "Credit", tags: ["rewards"] },
    { kind: "expense", amount: "1850.00", days: 27, category: "Rent", note: "Apartment — May", budgetId: budLife!.id, accountId: accMain!.id, categoryId: catHome!.id, merchant: "Skyline Properties", paymentMethod: "ACH", tags: ["housing", "fixed"] },
    { kind: "expense", amount: "89.40", days: 26, category: null, note: "", budgetId: budFood!.id, accountId: accMain!.id, categoryId: catGroceries!.id, merchant: "FreshMart", paymentMethod: "Debit", tags: ["groceries"] },
    { kind: "expense", amount: "124.18", days: 25, category: null, note: "", budgetId: budFood!.id, accountId: accCard!.id, categoryId: catGroceries!.id, merchant: "Whole Goods", paymentMethod: "Credit", tags: ["groceries"] },
    { kind: "expense", amount: "42.50", days: 24, category: null, note: "Lunch with team", budgetId: budFood!.id, accountId: accCard!.id, categoryId: catDining!.id, merchant: "Urban Bowl", paymentMethod: "Credit", tags: ["dining", "work"] },
    { kind: "expense", amount: "18.75", days: 24, category: null, note: "Coffee", budgetId: budFood!.id, accountId: accCash!.id, categoryId: catDining!.id, merchant: "Roast & Co", paymentMethod: "Cash", tags: ["coffee"] },
    { kind: "expense", amount: "64.00", days: 22, category: null, note: "Streaming", budgetId: budLife!.id, accountId: accCard!.id, categoryId: catEnt!.id, merchant: "StreamVault", paymentMethod: "Credit", tags: ["subscription"] },
    { kind: "expense", amount: "12.99", days: 22, category: null, note: "Cloud storage", budgetId: budLife!.id, accountId: accCard!.id, categoryId: catEnt!.id, merchant: "SkyDrive Pro", paymentMethod: "Credit", tags: ["subscription", "work"] },
    { kind: "expense", amount: "45.00", days: 21, category: null, note: "Gym", budgetId: budLife!.id, accountId: accMain!.id, categoryId: catHealth!.id, merchant: "Pulse Gym", paymentMethod: "Debit", tags: ["health"] },
    { kind: "expense", amount: "32.00", days: 20, category: null, note: "Pharmacy", budgetId: budLife!.id, accountId: accCard!.id, categoryId: catHealth!.id, merchant: "CityCare Pharmacy", paymentMethod: "Credit", tags: ["health"] },
    { kind: "expense", amount: "78.20", days: 19, category: null, note: "Fuel", budgetId: budLife!.id, accountId: accCard!.id, categoryId: catTransport!.id, merchant: "QuickFuel", paymentMethod: "Credit", tags: ["transport"] },
    { kind: "expense", amount: "24.50", days: 18, category: null, note: "Ride share", budgetId: budLife!.id, accountId: accMain!.id, categoryId: catTransport!.id, merchant: "ZoomRide", paymentMethod: "Debit", tags: ["transport"] },
    { kind: "expense", amount: "210.00", days: 17, category: null, note: "Weekend trip — train", budgetId: budTravel!.id, accountId: accCard!.id, categoryId: catTransport!.id, merchant: "RailLink", paymentMethod: "Credit", tags: ["travel"] },
    { kind: "expense", amount: "156.00", days: 16, category: null, note: "Boutique hotel", budgetId: budTravel!.id, accountId: accCard!.id, categoryId: catEnt!.id, merchant: "Harbor Inn", paymentMethod: "Credit", tags: ["travel", "lodging"] },
    { kind: "expense", amount: "58.90", days: 15, category: null, note: "Dinner", budgetId: budFood!.id, accountId: accCard!.id, categoryId: catDining!.id, merchant: "Saffron Table", paymentMethod: "Credit", tags: ["dining"] },
    { kind: "expense", amount: "9.99", days: 14, category: null, note: "Mobile plan add-on", budgetId: budLife!.id, accountId: accMain!.id, categoryId: null, merchant: "NeoMobile", paymentMethod: "Debit", tags: ["utilities"] },
    { kind: "expense", amount: "140.00", days: 13, category: null, note: "Electric bill", budgetId: budLife!.id, accountId: accMain!.id, categoryId: catHome!.id, merchant: "GridOne Energy", paymentMethod: "ACH", tags: ["utilities"] },
    { kind: "expense", amount: "72.00", days: 11, category: null, note: "Household supplies", budgetId: budLife!.id, accountId: accMain!.id, categoryId: catHome!.id, merchant: "MegaMart", paymentMethod: "Debit", tags: ["home"] },
    { kind: "expense", amount: "28.00", days: 10, category: null, note: "Book", budgetId: budLife!.id, accountId: accCard!.id, categoryId: catEnt!.id, merchant: "Chapter House", paymentMethod: "Credit", tags: ["books"] },
    { kind: "expense", amount: "15.00", days: 9, category: null, note: "Parking", budgetId: budLife!.id, accountId: accCash!.id, categoryId: catTransport!.id, merchant: "CityPark", paymentMethod: "Cash", tags: ["transport"] },
    { kind: "expense", amount: "499.00", days: 8, category: null, note: "Flight deal", budgetId: budTravel!.id, accountId: accCard!.id, categoryId: catTransport!.id, merchant: "SkyHop Airlines", paymentMethod: "Credit", tags: ["travel", "flight"] },
    { kind: "expense", amount: "36.40", days: 7, category: null, note: "", budgetId: budFood!.id, accountId: accMain!.id, categoryId: catGroceries!.id, merchant: "FreshMart", paymentMethod: "Debit", tags: ["groceries"] },
    { kind: "expense", amount: "22.00", days: 6, category: null, note: "Takeout", budgetId: budFood!.id, accountId: accCard!.id, categoryId: catDining!.id, merchant: "Spice Route", paymentMethod: "Credit", tags: ["dining"] },
    { kind: "expense", amount: "110.00", days: 5, category: null, note: "Dentist co-pay", budgetId: budLife!.id, accountId: accMain!.id, categoryId: catHealth!.id, merchant: "BrightSmile Dental", paymentMethod: "Debit", tags: ["health"] },
    { kind: "expense", amount: "19.50", days: 4, category: null, note: "Snacks", budgetId: budFood!.id, accountId: accCash!.id, categoryId: catGroceries!.id, merchant: "Corner Express", paymentMethod: "Cash", tags: ["groceries"] },
    { kind: "expense", amount: "250.00", days: 3, category: null, note: "Transfer to savings", budgetId: null, accountId: accMain!.id, categoryId: null, merchant: null, paymentMethod: "Transfer", tags: ["savings"] },
    { kind: "income", amount: "250.00", days: 3, category: null, note: "Transfer from checking", budgetId: null, accountId: accSave!.id, categoryId: null, merchant: null, paymentMethod: "Transfer", tags: ["savings"] },
    { kind: "income", amount: "75.00", days: 2, category: null, note: "Sold desk lamp", budgetId: null, accountId: accMain!.id, categoryId: null, merchant: "MarketPlace", paymentMethod: "ACH", tags: ["misc-income"] },
    { kind: "expense", amount: "44.00", days: 1, category: null, note: "Brunch", budgetId: budFood!.id, accountId: accCard!.id, categoryId: catDining!.id, merchant: "Sunny Side Café", paymentMethod: "Credit", tags: ["dining", "weekend"] },
    { kind: "expense", amount: "67.80", days: 0, category: null, note: "Weekly groceries", budgetId: budFood!.id, accountId: accMain!.id, categoryId: catGroceries!.id, merchant: "FreshMart", paymentMethod: "Debit", tags: ["groceries"] },
  ];

  for (const t of txs) {
    const occurred = daysAgo(t.days);
    await sql`
      INSERT INTO transactions (
        user_id, budget_id, kind, amount, category, note, occurred_on,
        account_id, category_id, merchant, payment_method, tags
      )
      VALUES (
        ${uid},
        ${t.budgetId},
        ${t.kind}::finance_tx_kind,
        ${t.amount}::numeric,
        ${t.category},
        ${t.note},
        ${occurred}::date,
        ${t.accountId},
        ${t.categoryId},
        ${t.merchant},
        ${t.paymentMethod},
        ${t.tags.length > 0 ? sql.array(t.tags) : sql`ARRAY[]::text[]`}
      )
    `;
  }

  await sql`
    INSERT INTO debt_obligations (user_id, counterparty, direction, principal, balance, currency, due_date, status, notes)
    VALUES (
      ${uid},
      'EduFinance Student Loan',
      'owed',
      18500.00,
      14200.00,
      'INR',
      ${daysAgo(-400)}::date,
      'open',
      'Fixed rate — demo balance.'
    )
  `;
  await sql`
    INSERT INTO debt_obligations (user_id, counterparty, direction, principal, balance, currency, due_date, status, notes)
    VALUES (
      ${uid},
      'Metro Auto Finance',
      'owed',
      12800.00,
      8200.00,
      'INR',
      ${daysAgo(-120)}::date,
      'open',
      'Vehicle installment.'
    )
  `;
  await sql`
    INSERT INTO debt_obligations (user_id, counterparty, direction, principal, balance, currency, due_date, status, notes)
    VALUES (
      ${uid},
      'Friend — split trip',
      'lent',
      500.00,
      180.00,
      'INR',
      ${daysAgo(-14)}::date,
      'open',
      'They owe you from shared Airbnb.'
    )
  `;

  console.log(
    `Done. Inserted accounts, categories, budgets, ${txs.length} transactions, and debt demo rows for ${email}.`
  );
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
