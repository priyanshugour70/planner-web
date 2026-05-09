import "server-only";
import postgres from "postgres";
import { resolveDatabaseUrl } from "@/lib/db-url";

/** Widen client typing: default `postgres.Sql<{}>` treats parameters as `never` for interpolated values. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SqlClient = postgres.Sql<any>;

type GlobalWithPg = typeof globalThis & { __planner_pg?: SqlClient };

/**
 * Single shared client for the Node.js process.
 * `prepare: false` is required for Supabase transaction pooler (PgBouncer, port 6543).
 */
export function getSql(): SqlClient {
  const g = globalThis as GlobalWithPg;
  if (process.env.NODE_ENV !== "production" && g.__planner_pg) {
    return g.__planner_pg;
  }

  const max = Math.min(20, Math.max(1, Number(process.env.PG_POOL_MAX ?? 10) || 10));

  const sql = postgres(resolveDatabaseUrl(), {
    max,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
    ssl: "require",
  }) as SqlClient;

  if (process.env.NODE_ENV !== "production") {
    g.__planner_pg = sql;
  }

  return sql;
}
