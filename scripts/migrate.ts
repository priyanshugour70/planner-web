import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { resolveDatabaseUrl } from "../src/lib/db-url";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

async function main() {
  const url = resolveDatabaseUrl();
  const sql = postgres(url, {
    max: 1,
    ssl: "require",
    prepare: false,
  });

  const dir = path.join(process.cwd(), "db/migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const continueOnError = process.argv.includes("--continue");

  for (const file of files) {
    const full = path.join(dir, file);
    const body = fs.readFileSync(full, "utf8");
    process.stdout.write(`Applying ${file}...\n`);
    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
