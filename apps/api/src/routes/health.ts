import { APP_VERSION, PHASE } from "@vault/types";
import type { FastifyInstance } from "fastify";
import { checkDatabase } from "../db.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    status: "ok" as const,
    service: "vault-api",
    version: APP_VERSION,
    phase: PHASE,
    timestamp: new Date().toISOString(),
  }));

  app.get("/ready", async (_request, reply) => {
    const database = await checkDatabase(app.db);
    const ready = database !== "error";
    reply.status(ready ? 200 : 503);
    return {
      status: ready ? ("ready" as const) : ("not_ready" as const),
      checks: { database },
      timestamp: new Date().toISOString(),
    };
  });
}
