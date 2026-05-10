/**
 * Runs demo seeds in a sensible order (finance first — accounts used by transactions;
 * then tasks/goals). Same env vars as individual scripts.
 *
 *   pnpm db:seed
 *   SEED_FINANCE_EMAIL=a@b.com SEED_TASKS_EMAIL=a@b.com pnpm db:seed --force
 *
 * Pass-through: append `--force` to wipe/re-seed per script rules.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const cwd = process.cwd();
const extra = process.argv.slice(2).join(" ");
const cmd = (script: string) =>
  `pnpm exec tsx ${path.join("scripts", script)}${extra ? ` ${extra}` : ""}`;

function main() {
  console.log("Running db:seed:finance …\n");
  execSync(cmd("seed-finance-demo.ts"), { stdio: "inherit", cwd, env: process.env });
  console.log("\nRunning db:seed:tasks …\n");
  execSync(cmd("seed-tasks-demo.ts"), { stdio: "inherit", cwd, env: process.env });
  console.log("\nAll seeds finished.");
}

main();
