import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotenv } from "dotenv";

/**
 * Load .env without overriding variables already set in the process.
 * npm workspace scripts run from apps/api, so we also check the repo root.
 */
export function loadEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
  ];

  for (const file of candidates) {
    if (existsSync(file)) {
      loadDotenv({ path: file, override: false });
      return;
    }
  }
}
