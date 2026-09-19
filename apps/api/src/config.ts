import { z } from "zod";

const postgresUrl = z
  .string()
  .min(1)
  .refine(
    (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
    "DATABASE_URL must start with postgres:// or postgresql://",
  );

const booleanFlag = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().min(1).default("0.0.0.0"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: postgresUrl.optional(),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.string().min(1).default("1 minute"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_SEC: z.coerce.number().int().min(60).max(3600).default(900),
  AUTH_LOCKOUT_THRESHOLD: z.coerce.number().int().min(3).max(20).default(8),
  AUTH_LOCKOUT_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  SINGLE_USER_MODE: booleanFlag,
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  const config = parsed.data;
  if (
    config.NODE_ENV === "production" &&
    (config.CORS_ORIGIN === "*" || config.CORS_ORIGIN.includes("localhost"))
  ) {
    throw new Error("Production CORS_ORIGIN must be an explicit non-localhost origin");
  }
  if (config.NODE_ENV === "production" && /replace-with-a-long-random/i.test(config.JWT_SECRET)) {
    throw new Error("JWT_SECRET must be replaced with a random value in production");
  }

  return config;
}
