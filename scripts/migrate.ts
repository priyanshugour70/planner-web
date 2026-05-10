import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { resolveDatabaseUrl } from "../src/lib/db-url";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

/** App-specific ledger; avoids clashing with other tools that use `schema_migrations`. */
const MIGRATIONS_TABLE = "planner_schema_migrations";

function listMigrationFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

function migrationOrderKey(file: string): number {
  const m = file.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function parseBaselineThrough(): number | null {
  const eq = process.argv.find((a) => a.startsWith("--baseline-through="));
  if (eq) {
    const n = parseInt(eq.split("=")[1]?.trim() ?? "", 10);
    return Number.isFinite(n) ? n : null;
  }
  const idx = process.argv.indexOf("--baseline-through");
  if (idx !== -1 && process.argv[idx + 1]) {
    const n = parseInt(process.argv[idx + 1], 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function main() {
  const url = resolveDatabaseUrl();
  const sql = postgres(url, {
    max: 1,
    ssl: "require",
    prepare: false,
  });

  const dir = path.join(process.cwd(), "db/migrations");
  const files = listMigrationFiles(dir);
  const continueOnError = process.argv.includes("--continue");
  const baselineAll = process.argv.includes("--baseline-all");
  const baselineThrough = parseBaselineThrough();

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql.unsafe(MIGRATIONS_TABLE)} (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  if (baselineAll || baselineThrough !== null) {
    const toMark = baselineAll
      ? files
      : files.filter((f) => migrationOrderKey(f) <= (baselineThrough as number));
    if (toMark.length === 0) {
      process.stdout.write("No migration files matched baseline criteria.\n");
    } else {
      console.warn(
        "[migrate] Baseline only records names in planner_schema_migrations; it does not run SQL. " +
          "Use only when the database already matches those files."
      );
      process.stdout.write(
        `Recording ${toMark.length} migration(s) as already applied (no SQL executed)…\n`
      );
      for (const name of toMark) {
        await sql`
          INSERT INTO ${sql.unsafe(MIGRATIONS_TABLE)} (name) VALUES (${name})
          ON CONFLICT (name) DO NOTHING
        `;
        process.stdout.write(`  + ${name}\n`);
      }
    }
  }

  for (const file of files) {
    const already = await sql<{ name: string }[]>`
      SELECT name FROM ${sql.unsafe(MIGRATIONS_TABLE)} WHERE name = ${file}
    `;
    if (already.length > 0) {
      process.stdout.write(`Skipping ${file} (already applied).\n`);
      continue;
    }

    const full = path.join(dir, file);
    const body = fs.readFileSync(full, "utf8");
    process.stdout.write(`Applying ${file}...\n`);
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`
          INSERT INTO ${tx.unsafe(MIGRATIONS_TABLE)} (name) VALUES (${file})
        `;
      });
    } catch (err) {
      console.error(`Migration failed: ${file}`, err);
      if (!continueOnError) {
        await sql.end({ timeout: 5 });
        process.exit(1);
      }
    }
  }

  await sql.end({ timeout: 10 });
  process.stdout.write("Migrations complete.\n");
  process.stdout.write("Optional demo data: pnpm db:seed (finance + tasks) or pnpm db:seed:tasks / pnpm db:seed:finance\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
