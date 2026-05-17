const fs = require("node:fs");
const path = require("node:path");
const postgres = require("postgres");

function loadDotenv() {
  const envPaths = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env")
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const idx = trimmed.indexOf("=");
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

loadDotenv();

function resolveDatabaseUrl() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const host = process.env.PGHOST?.trim();
  const user = process.env.PGUSER?.trim();
  const password = process.env.PGPASSWORD?.trim();
  if (!host || !user || !password) {
    throw new Error(
      "Set DATABASE_URL or PGHOST, PGUSER, and PGPASSWORD (optional: PGPORT, PGDATABASE)."
    );
  }

  const port = process.env.PGPORT?.trim() || "6543";
  const database = process.env.PGDATABASE?.trim() || "postgres";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

async function main() {
  const url = resolveDatabaseUrl();
  console.log("Connecting to database to force-apply migration 009...");
  const sql = postgres(url, {
    max: 1,
    ssl: "require",
    prepare: false,
  });

  const fullPath = path.join(process.cwd(), "db/migrations/009_habits_journal_enhanced.sql");
  if (!fs.existsSync(fullPath)) {
    console.error("Migration file db/migrations/009_habits_journal_enhanced.sql not found!");
    process.exit(1);
  }

  const body = fs.readFileSync(fullPath, "utf8");
  console.log("Executing SQL statements from 009_habits_journal_enhanced.sql...");

  try {
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      
      // Ensure it is recorded as applied
      const MIGRATIONS_TABLE = "planner_schema_migrations";
      await tx`
        INSERT INTO ${tx.unsafe(MIGRATIONS_TABLE)} (name) 
        VALUES ('009_habits_journal_enhanced.sql')
        ON CONFLICT (name) DO NOTHING
      `;
    });
    console.log("SUCCESS: Migration 009_habits_journal_enhanced.sql has been successfully force-applied!");
  } catch (err) {
    console.error("Failed to execute statements:", err);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
