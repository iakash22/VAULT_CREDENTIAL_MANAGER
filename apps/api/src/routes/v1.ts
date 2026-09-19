import type { FastifyInstance } from "fastify";
import { authenticatePlugin } from "../plugins/authenticate.js";
import { authRoutes } from "./auth.js";
import { healthRoutes } from "./health.js";

export async function registerV1Routes(app: FastifyInstance): Promise<void> {
  await authenticatePlugin(app);
  await app.register(healthRoutes, { prefix: "/api/v1" });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
}
