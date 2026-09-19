import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const JWT_SECRET = "a".repeat(32);

describe("env validation", () => {
  it("applies development defaults", () => {
    const config = loadConfig({ NODE_ENV: "development", JWT_SECRET });
    expect(config.API_PORT).toBe(3001);
    expect(config.CORS_ORIGIN).toBe("http://localhost:5173");
    expect(config.DATABASE_URL).toBeUndefined();
    expect(config.JWT_EXPIRES_SEC).toBe(900);
  });

  it("rejects a short JWT secret", () => {
    expect(() => loadConfig({ NODE_ENV: "development", JWT_SECRET: "too-short" })).toThrow(
      /JWT_SECRET/,
    );
  });

  it("rejects a non-postgres DATABASE_URL", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "development",
        JWT_SECRET,
        DATABASE_URL: "https://example.com/not-a-database",
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it("rejects wildcard CORS in production", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "production",
        JWT_SECRET,
        CORS_ORIGIN: "*",
        DATABASE_URL: "postgresql://vault:pass@db:5432/vault",
      }),
    ).toThrow(/CORS_ORIGIN/);
  });
});
