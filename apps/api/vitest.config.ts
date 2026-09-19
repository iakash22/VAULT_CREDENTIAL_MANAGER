import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { defineConfig } from "vitest/config";

loadDotenv({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-jwt-secret-do-not-use-in-prod-32",
      SINGLE_USER_MODE: "false",
    },
  },
});
