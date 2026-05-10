/**
 * Seeds demo tasks (and minimal goals) for a single user: varied status, priorities,
 * due dates, tags, parent/child links, and goal linkage — matches API expectations.
 *
 * Usage:
 *   pnpm db:seed:tasks
 *   SEED_TASKS_EMAIL=you@example.com pnpm db:seed:tasks --force
 *
 * `--force`: clears that user's tasks (and only goals whose title starts with
 * `Planner seed goal:`) so the demo can be re-applied cleanly.
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
const SEEDED_GOAL_TITLE_PREFIX = "Planner seed goal:";

function daysFromNowUtc(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

async function clearUserTasks(sql: Sql, uid: bigint) {
  await sql`UPDATE tasks SET parent_task_id = NULL WHERE user_id = ${uid}`;
  await sql`DELETE FROM tasks WHERE user_id = ${uid}`;
}

async function clearSeededGoals(sql: Sql, uid: bigint) {
  await sql`
    DELETE FROM goals
    WHERE user_id = ${uid}
      AND title LIKE ${SEEDED_GOAL_TITLE_PREFIX + "%"}
  `;
}

async function main() {
  const email = (process.env.SEED_TASKS_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
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
    console.log(`Removing seeded goals (prefix) and all tasks for user ${uid}…`);
    await clearUserTasks(sql, uid);
    await clearSeededGoals(sql, uid);
  } else {
    const [{ c }] = await sql<{ c: number }[]>`
      SELECT COUNT(*)::int AS c FROM tasks WHERE user_id = ${uid}
    `;
    if (c > 12) {
      console.log(`User already has ${c} tasks. Re-run with --force to replace demo tasks.`);
      await sql.end();
      return;
    }
  }

  console.log(`Seeding tasks demo for ${email} (user_id=${uid})…`);

  const [gProduct] = await sql<{ id: bigint }[]>`
    INSERT INTO goals (user_id, title, description, status, priority, target_date, progress)
    VALUES (
      ${uid},
      ${`${SEEDED_GOAL_TITLE_PREFIX} Q1 product`},
      'Demo goal for task linkage.',
      'active',
      3,
      ${daysFromNowUtc(45).toISOString().slice(0, 10)}::date,
      35
    ) RETURNING id
  `;
  const [gLife] = await sql<{ id: bigint }[]>`
    INSERT INTO goals (user_id, title, description, status, priority, target_date, progress)
    VALUES (
      ${uid},
      ${`${SEEDED_GOAL_TITLE_PREFIX} Life admin`},
      'Demo goal for errands and personal work.',
      'active',
      2,
      ${daysFromNowUtc(14).toISOString().slice(0, 10)}::date,
      10
    ) RETURNING id
  `;

  const [rootApi] = await sql<{ id: bigint }[]>`
    INSERT INTO tasks (
      user_id, goal_id, parent_task_id, title, description, status, priority, due_at, completed_at, tags
    )
    VALUES (
      ${uid},
      ${gProduct!.id},
      NULL,
      'Finalize OpenAPI spec for planner',
      'Cover tasks, goals, and error shapes. Align with mobile clients.',
      'in_progress',
      4,
      ${daysFromNowUtc(5)},
      NULL,
      ${sql.array(["api", "docs", "deep-work"])}
    ) RETURNING id
  `;

  await sql`
    INSERT INTO tasks (
      user_id, goal_id, parent_task_id, title, description, status, priority, due_at, completed_at, tags
    )
    VALUES (
      ${uid},
      ${gProduct!.id},
      ${rootApi!.id},
      'Document validation error codes',
      'Map Zod issues to stable error code values for clients.',
      'todo',
      3,
      ${daysFromNowUtc(7)},
      NULL,
      ${sql.array(["api", "errors"])}
    )
  `;

  await sql`
    INSERT INTO tasks (
      user_id, goal_id, parent_task_id, title, description, status, priority, due_at, completed_at, tags
    )
    VALUES (
      ${uid},
      ${gProduct!.id},
      NULL,
      'Ship dark-mode QA checklist',
      NULL,
      'todo',
      2,
      ${daysFromNowUtc(3)},
      NULL,
      ${sql.array(["qa", "ui"])}
    )
  `;

  await sql`
    INSERT INTO tasks (
      user_id, goal_id, parent_task_id, title, description, status, priority, due_at, completed_at, tags
    )
    VALUES (
      ${uid},
      NULL,
      NULL,
      'Weekly team sync notes',
      'Agenda: metrics, blockers, hiring.',
      'done',
      2,
      ${daysFromNowUtc(-2)},
      ${daysFromNowUtc(-1)},
      ${sql.array(["meeting", "team"])}
    )
  `;

  await sql`
    INSERT INTO tasks (
      user_id, goal_id, parent_task_id, title, description, status, priority, due_at, completed_at, tags
    )
    VALUES (
      ${uid},
      ${gLife!.id},
      NULL,
      'Renew vehicle insurance',
      'Compare two quotes; attach PDF to notes.',
      'todo',
      3,
      ${daysFromNowUtc(20)},
      NULL,
      ${sql.array(["personal", "finance"])}
    )
  `;

  await sql`
    INSERT INTO tasks (
      user_id, goal_id, parent_task_id, title, description, status, priority, due_at, completed_at, tags
    )
    VALUES (
      ${uid},
      ${gLife!.id},
      NULL,
      'Schedule annual health checkup',
      NULL,
      'todo',
      2,
      NULL,
      NULL,
      ${sql.array(["health"])}
    )
  `;

  await sql`
    INSERT INTO tasks (
      user_id, goal_id, parent_task_id, title, description, status, priority, due_at, completed_at, tags
    )
    VALUES (
      ${uid},
      NULL,
      NULL,
      'Archive old vendor contract (cancelled)',
      'Superseded by 2026 MSA — no further action.',
      'cancelled',
      1,
      NULL,
      NULL,
      ${sql.array(["legal", "archived"])}
    )
  `;

  await sql`
    INSERT INTO tasks (
      user_id, goal_id, parent_task_id, title, description, status, priority, due_at, completed_at, tags
    )
    VALUES (
      ${uid},
      ${gProduct!.id},
      NULL,
      'Load-test write path on staging',
      'Burst 200 rps; watch p95 latency.',
      'todo',
      4,
      ${daysFromNowUtc(10)},
      NULL,
      ${sql.array(["perf", "staging"])}
    )
  `;

  const [{ n }] = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM tasks WHERE user_id = ${uid}
  `;

  console.log(
    `Done. Seeded 2 goals (${SEEDED_GOAL_TITLE_PREFIX}…) and demo tasks for ${email} (total tasks for user: ${n}).`
  );
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
