import { PrismaClient } from "@prisma/client";

/**
 * WHY Prisma: typed queries, migrations, and a single schema source of truth.
 * Never log DATABASE_URL — it contains the database password.
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string");
  }

  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
}

export async function checkDatabase(db?: PrismaClient | null): Promise<"ok" | "skipped" | "error"> {
  if (!db) {
    return "skipped";
  }

  try {
    await db.$queryRaw`SELECT 1 AS ok`;
    return "ok";
  } catch {
    return "error";
  }
}
