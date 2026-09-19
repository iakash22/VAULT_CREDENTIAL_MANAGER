import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import type { Pool } from "pg";
import type { AccessTokenClaims } from "./auth/jwt.js";
import { loadConfig, type AppConfig } from "./config.js";
import { createPool } from "./db.js";
import { HttpError } from "./httpError.js";
import { migrate } from "./migrate.js";
import { registerV1Routes } from "./routes/v1.js";

export async function buildApp(overrides?: Partial<AppConfig>): Promise<FastifyInstance> {
  const config = { ...loadConfig(), ...overrides };
  const app = Fastify({
    logger: config.NODE_ENV !== "test",
    trustProxy: true,
    bodyLimit: 64 * 1024,
  });

  app.decorate("config", config);

  const pool = config.DATABASE_URL ? createPool(config.DATABASE_URL) : null;
  app.decorate("db", pool);
  if (pool) {
    await migrate(pool);
    app.addHook("onClose", async () => {
      await pool.end();
    });
  }

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
    hsts: config.NODE_ENV === "production",
  });

  await app.register(cors, {
    origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN.split(",").map((value) => value.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  await app.register(rateLimit, {
    max: config.NODE_ENV === "test" ? 10_000 : config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
  });

  await registerV1Routes(app);

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: "Not found" });
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({ error: error.message });
    }
    const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
    reply.status(status).send({
      error: status >= 500 ? "Internal server error" : error.message,
    });
  });

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    config: AppConfig;
    db: Pool | null;
    authenticate: (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user: AccessTokenClaims | null;
  }
}
