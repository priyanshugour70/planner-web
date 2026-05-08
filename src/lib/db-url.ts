export function resolveDatabaseUrl(): string {
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
