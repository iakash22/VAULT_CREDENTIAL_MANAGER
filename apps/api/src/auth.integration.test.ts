import { deriveMasterKeySet, encodeAuthVerifier } from "@vault/crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { deleteUserByUsername } from "./auth/users.js";

const TEST_KDF = {
  memoryKiB: 16,
  iterations: 1,
  parallelism: 1,
  hashLength: 32,
} as const;

const username = `vitest-${Date.now()}`;
const password = "correct horse battery";
const databaseUrl = process.env.DATABASE_URL;

const describeAuth = databaseUrl ? describe : describe.skip;

describeAuth("auth API", () => {
  let app: Awaited<ReturnType<typeof buildApp>> | undefined;

  beforeAll(async () => {
    app = await buildApp({
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl,
      JWT_SECRET: "test-jwt-secret-do-not-use-in-prod-32",
      SINGLE_USER_MODE: false,
    });
    if (app.db) {
      await deleteUserByUsername(app.db, username);
    }
  });

  afterAll(async () => {
    if (!app) {
      return;
    }
    if (app.db) {
      await deleteUserByUsername(app.db, username);
    }
    await app.close();
  });

  it("rejects a plaintext password on register", async () => {
    if (!app) {
      throw new Error("API failed to start");
    }
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { username, password, authVerifier: "x", kdf: TEST_KDF },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatch(/must not be sent/i);
  });

  it("registers, logs in, and returns the current user", async () => {
    if (!app) {
      throw new Error("API failed to start");
    }
    const keys = await deriveMasterKeySet(password, TEST_KDF);
    const authVerifier = encodeAuthVerifier(keys.authVerifier);

    const registered = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { username, authVerifier, kdf: keys.kdf },
    });
    expect(registered.statusCode).toBe(201);
    expect(registered.json().token).toBeTypeOf("string");

    const kdf = await app.inject({
      method: "GET",
      url: `/api/v1/auth/kdf-params?username=${username}`,
    });
    expect(kdf.statusCode).toBe(200);
    expect(kdf.json().kdf.salt).toBe(keys.kdf.salt);

    const loginKeys = await deriveMasterKeySet(password, kdf.json().kdf);
    const loggedIn = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username, authVerifier: encodeAuthVerifier(loginKeys.authVerifier) },
    });
    expect(loggedIn.statusCode).toBe(200);

    const me = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { authorization: `Bearer ${loggedIn.json().token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().username).toBe(username);
  });

  it("rejects the wrong verifier", async () => {
    if (!app) {
      throw new Error("API failed to start");
    }
    const keys = await deriveMasterKeySet("totally different phrase", TEST_KDF);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username, authVerifier: encodeAuthVerifier(keys.authVerifier) },
    });
    expect(response.statusCode).toBe(401);
  });
});
