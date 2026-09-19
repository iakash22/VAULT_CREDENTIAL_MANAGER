import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

const app = await buildApp({ NODE_ENV: "test", DATABASE_URL: undefined });

afterAll(async () => {
  await app.close();
});

describe("API v1 health", () => {
  it("returns liveness", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe("ok");
    expect(body.phase).toBe(2);
    expect(body.service).toBe("vault-api");
  });

  it("skips the database check when DATABASE_URL is unset", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/ready" });
    expect(response.statusCode).toBe(200);
    expect(response.json().checks.database).toBe("skipped");
  });

  it("returns a generic 404 payload", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/missing" });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Not found" });
  });
});
