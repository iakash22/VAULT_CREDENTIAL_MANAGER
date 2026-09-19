import pg, { type Pool } from "pg";

/**
 * WHY a pool, not a client per request: later phases open a connection on
 * every authenticated call. A pool reuses sockets and fails fast on startup.
 * Never log the connection string — it contains the database password.
 */
export function createPool(databaseUrl: string): Pool {
  if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string");
  }

  return new pg.Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 2_000,
  });
}

export async function checkDatabase(pool?: Pool | null): Promise<"ok" | "skipped" | "error"> {
  if (!pool) {
    return "skipped";
  }

  try {
    const result = await pool.query("SELECT 1 AS ok");
    return result.rowCount === 1 ? "ok" : "error";
  } catch {
    return "error";
  }
}
