import { config } from "dotenv";
import { execSync } from "node:child_process";
import path from "node:path";
import postgres from "postgres";
import { resolveDatabaseUrl } from "../src/lib/db-url";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const confirmed =
  process.argv.includes("--yes") ||
  process.argv.includes("-y") ||
  process.env.DB_RESET_CONFIRM?.trim() === "YES";

const skipMigrate = process.argv.includes("--no-migrate");

async function main() {
  if (!confirmed) {
    console.error(
      "Refusing to wipe the database. Re-run with --yes (or -y), or set DB_RESET_CONFIRM=YES."
    );
    process.exit(1);
  }

  const url = resolveDatabaseUrl();
  const sql = postgres(url, {
    max: 1,
    ssl: "require",
    prepare: false,
  });

  try {
    await sql.unsafe(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO PUBLIC;
    `);

    await sql`
      DO $supabase_grants$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN
          SELECT rolname
          FROM pg_roles
          WHERE rolname IN (
            'anon',
            'authenticated',
            'service_role',
            'supabase_admin',
            'dashboard_user'
          )
        LOOP
          EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', r.rolname);
          EXECUTE format('GRANT CREATE ON SCHEMA public TO %I', r.rolname);
          EXECUTE format('GRANT ALL ON SCHEMA public TO %I', r.rolname);
        END LOOP;
      END
      $supabase_grants$;
    `;
  } finally {
    await sql.end({ timeout: 15 });
  }

  console.log("Dropped and recreated schema public.");

  if (!skipMigrate) {
    console.log("Running migrations...\n");
    execSync("pnpm exec tsx scripts/migrate.ts", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
    });
    console.log("\nReset complete (schema + migrations).");
    console.log("Optional: pnpm db:seed (finance + tasks demo for priyanshugour1@gmail.com or SEED_*_EMAIL).");
  } else {
    console.log("Skipped migrations (--no-migrate). Run: pnpm db:migrate");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
