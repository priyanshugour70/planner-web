import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { resolveDatabaseUrl } from "../src/lib/db-url";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const REPAIR_FILE = "002_repair_missing_objects.sql";

async function main() {
  const url = resolveDatabaseUrl();
  const sql = postgres(url, {
    max: 1,
    ssl: "require",
    prepare: false,
  });

  const full = path.join(process.cwd(), "db/migrations", REPAIR_FILE);
  if (!fs.existsSync(full)) {
    console.error(`Missing ${full}`);
    process.exit(1);
  }
  const body = fs.readFileSync(full, "utf8");
  process.stdout.write(`Applying ${REPAIR_FILE} (idempotent repair)...\n`);
  await sql.begin(async (tx) => {
    await tx.unsafe(body);
  });
  await sql.end({ timeout: 10 });
  process.stdout.write("Repair complete.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
