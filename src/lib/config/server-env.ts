import { z } from "zod";

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().optional(),
    PGHOST: z.string().optional(),
    PGUSER: z.string().optional(),
    PGPASSWORD: z.string().optional(),
    PGPORT: z.string().optional(),
    PGDATABASE: z.string().optional(),
    PG_POOL_MAX: z.coerce.number().optional(),

    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_ISSUER: z.string().default("planner-web"),
    JWT_AUDIENCE: z.string().default("planner-clients"),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().min(60).max(3600).default(900),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().min(300).default(60 * 60 * 24 * 30),

    BCRYPT_COST: z.coerce.number().min(10).max(14).default(12),

    CORS_ORIGINS: z.string().optional(),

    REFRESH_COOKIE_NAME: z.string().default("planner_refresh"),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().default(120),
  })
  .superRefine((val, ctx) => {
    const hasUrl = Boolean(val.DATABASE_URL?.trim());
    const hasParts = Boolean(val.PGHOST && val.PGUSER && val.PGPASSWORD);
    if (!hasUrl && !hasParts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide DATABASE_URL or PGHOST + PGUSER + PGPASSWORD",
        path: ["DATABASE_URL"],
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid server environment: ${msg}`);
  }
  cached = parsed.data;
  return cached;
}

export function resetServerEnvCache(): void {
  cached = null;
}
