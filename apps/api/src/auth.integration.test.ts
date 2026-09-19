import {
  deriveMasterKeySet,
  encodeAuthVerifier,
  encryptJson,
  generateVaultKey,
  wrapKey,
} from "@vault/crypto";
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

  it("rejects malformed encrypted payloads", async () => {
    if (!app) {
      throw new Error("API failed to start");
    }
    const kdf = await app.inject({
      method: "GET",
      url: `/api/v1/auth/kdf-params?username=${username}`,
    });
    const loginKeys = await deriveMasterKeySet(password, kdf.json().kdf);
    const loggedIn = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username, authVerifier: encodeAuthVerifier(loginKeys.authVerifier) },
    });
    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/vault/key",
      headers: { authorization: `Bearer ${loggedIn.json().token}` },
      payload: { wrappedKey: { v: 2, alg: "AES-256-GCM", iv: "x", ct: "y" } },
    });
    expect(response.statusCode).toBe(400);
  });

  it("stores and retrieves a wrapped vault key", async () => {
    if (!app) {
      throw new Error("API failed to start");
    }
    const kdf = await app.inject({
      method: "GET",
      url: `/api/v1/auth/kdf-params?username=${username}`,
    });
    const loginKeys = await deriveMasterKeySet(password, kdf.json().kdf);
    const vaultKey = generateVaultKey();
    const wrappedKey = await wrapKey(vaultKey, loginKeys.encryptionKey);
    const loggedIn = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username, authVerifier: encodeAuthVerifier(loginKeys.authVerifier) },
    });
    const token = loggedIn.json().token as string;

    const created = await app.inject({
      method: "PUT",
      url: "/api/v1/vault/key",
      headers: { authorization: `Bearer ${token}` },
      payload: { wrappedKey },
    });
    expect(created.statusCode).toBe(201);

    const duplicate = await app.inject({
      method: "PUT",
      url: "/api/v1/vault/key",
      headers: { authorization: `Bearer ${token}` },
      payload: { wrappedKey },
    });
    expect(duplicate.statusCode).toBe(409);

    const fetched = await app.inject({
      method: "GET",
      url: "/api/v1/vault/key",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(fetched.statusCode).toBe(200);
    expect(fetched.json().wrappedKey.ct).toBe(wrappedKey.ct);
  });

  it("creates workspaces, nested collections, and returns a tree", async () => {
    if (!app) {
      throw new Error("API failed to start");
    }
    const kdf = await app.inject({
      method: "GET",
      url: `/api/v1/auth/kdf-params?username=${username}`,
    });
    const loginKeys = await deriveMasterKeySet(password, kdf.json().kdf);
    const loggedIn = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username, authVerifier: encodeAuthVerifier(loginKeys.authVerifier) },
    });
    const token = loggedIn.json().token as string;

    const workspace = await app.inject({
      method: "POST",
      url: "/api/v1/workspaces",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Personal" },
    });
    expect(workspace.statusCode).toBe(201);
    const workspaceId = workspace.json().id as string;

    const root = await app.inject({
      method: "POST",
      url: `/api/v1/workspaces/${workspaceId}/collections`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Infrastructure" },
    });
    expect(root.statusCode).toBe(201);
    const rootId = root.json().id as string;

    const nested = await app.inject({
      method: "POST",
      url: `/api/v1/workspaces/${workspaceId}/collections`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "SSH", parentId: rootId },
    });
    expect(nested.statusCode).toBe(201);

    const tree = await app.inject({
      method: "GET",
      url: `/api/v1/workspaces/${workspaceId}/tree`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(tree.statusCode).toBe(200);
    expect(tree.json().tree).toHaveLength(1);
    expect(tree.json().tree[0].children).toHaveLength(1);
    expect(tree.json().tree[0].children[0].name).toBe("SSH");
  });

  it("stores encrypted secrets and searches by title and type", async () => {
    if (!app) {
      throw new Error("API failed to start");
    }
    const kdf = await app.inject({
      method: "GET",
      url: `/api/v1/auth/kdf-params?username=${username}`,
    });
    const loginKeys = await deriveMasterKeySet(password, kdf.json().kdf);
    const loggedIn = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username, authVerifier: encodeAuthVerifier(loginKeys.authVerifier) },
    });
    const token = loggedIn.json().token as string;

    const workspace = await app.inject({
      method: "POST",
      url: "/api/v1/workspaces",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "SecretsTest" },
    });
    const workspaceId = workspace.json().id as string;
    const vaultKey = generateVaultKey();
    const encryptedPayload = await encryptJson(
      { type: "password", password: "super-secret" },
      vaultKey,
      "secret-password-v1",
    );

    const created = await app.inject({
      method: "POST",
      url: `/api/v1/workspaces/${workspaceId}/secrets`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: "GitHub Production",
        tags: ["prod", "github"],
        secretType: "password",
        encryptedPayload,
      },
    });
    expect(created.statusCode).toBe(201);
    const secretId = created.json().id as string;

    const fetched = await app.inject({
      method: "GET",
      url: `/api/v1/secrets/${secretId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(fetched.statusCode).toBe(200);
    expect(fetched.json().encryptedPayload.ct).toBe(encryptedPayload.ct);

    const search = await app.inject({
      method: "GET",
      url: `/api/v1/workspaces/${workspaceId}/secrets/search?q=github&type=password`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(search.statusCode).toBe(200);
    expect(search.json().secrets).toHaveLength(1);

    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/v1/secrets/${secretId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(deleted.statusCode).toBe(204);
  });

  it("refreshes a valid JWT", async () => {
    if (!app) {
      throw new Error("API failed to start");
    }
    const kdf = await app.inject({
      method: "GET",
      url: `/api/v1/auth/kdf-params?username=${username}`,
    });
    const loginKeys = await deriveMasterKeySet(password, kdf.json().kdf);
    const loggedIn = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { username, authVerifier: encodeAuthVerifier(loginKeys.authVerifier) },
    });
    const token = loggedIn.json().token as string;

    const refreshed = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(refreshed.statusCode).toBe(200);
    expect(refreshed.json().token).toBeTypeOf("string");
    expect(refreshed.json().token).not.toBe(token);
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
