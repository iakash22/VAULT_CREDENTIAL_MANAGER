import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { loadEnv } from "./loadEnv.js";

loadEnv();
const config = loadConfig();
const app = await buildApp(config);

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "Shutting down");
  await app.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await app.listen({ host: config.API_HOST, port: config.API_PORT });
app.log.info(
  { database: config.DATABASE_URL ? "configured" : "skipped" },
  "Vault API ready",
);
