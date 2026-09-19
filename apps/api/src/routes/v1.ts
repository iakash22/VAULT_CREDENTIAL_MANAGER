import type { FastifyInstance } from "fastify";
import { authenticatePlugin } from "../plugins/authenticate.js";
import { authRoutes } from "./auth.js";
import { healthRoutes } from "./health.js";
import { hierarchyRoutes } from "./hierarchy.js";
import { secretsRoutes } from "./secrets.js";
import { vaultRoutes } from "./vault.js";

export async function registerV1Routes(app: FastifyInstance): Promise<void> {
  await authenticatePlugin(app);
  await app.register(healthRoutes, { prefix: "/api/v1" });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(vaultRoutes, { prefix: "/api/v1/vault" });
  await app.register(hierarchyRoutes, { prefix: "/api/v1" });
  await app.register(secretsRoutes, { prefix: "/api/v1" });
}
