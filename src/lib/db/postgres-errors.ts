import postgres from "postgres";

export function getPostgresErrorCode(err: unknown): string | undefined {
  if (err instanceof postgres.PostgresError) return err.code;
  return undefined;
}

/** 42P01 = undefined_table, 42704 = undefined_object, 42703 = undefined_column */
export function isMissingSchemaObject(err: unknown): boolean {
  const code = getPostgresErrorCode(err);
  return code === "42P01" || code === "42704" || code === "42703";
}
