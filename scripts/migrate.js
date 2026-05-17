const fs = require("node:fs");
const path = require("node:path");
const postgres = require("postgres");

// Simple dotenv parser in case standard dotenv needs local pathing
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

const MIGRATIONS_TABLE = "planner_schema_migrations";

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

function listMigrationFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function main() {
  const url = resolveDatabaseUrl();
  console.log("Connecting to database for migrations...");
  const sql = postgres(url, {
    max: 1,
    ssl: "require",
    prepare: false,
  });

  const dir = path.join(process.cwd(), "db/migrations");
  const files = listMigrationFiles(dir);

  await sql`
    CREATE TABLE IF NOT EXISTS ${sql.unsafe(MIGRATIONS_TABLE)} (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  for (const file of files) {
    const already = await sql`
      SELECT name FROM ${sql.unsafe(MIGRATIONS_TABLE)} WHERE name = ${file}
    `;
    if (already.length > 0) {
      console.log(`Skipping ${file} (already applied).`);
      continue;
    }

    const full = path.join(dir, file);
    const body = fs.readFileSync(full, "utf8");
    console.log(`Applying ${file}...`);
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`
          INSERT INTO ${tx.unsafe(MIGRATIONS_TABLE)} (name) VALUES (${file})
        `;
      });
      console.log(`Successfully applied ${file}.`);
    } catch (err) {
      console.error(`Migration failed on file: ${file}`, err);
      await sql.end({ timeout: 5 });
      process.exit(1);
    }
  }

  await sql.end({ timeout: 10 });
  console.log("Migrations successfully completed!");
}

main().catch((err) => {
  console.error("Migration execution error:", err);
  process.exit(1);
});
