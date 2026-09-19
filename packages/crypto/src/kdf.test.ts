import { describe, expect, it } from "vitest";
import { deriveKey, deriveKeyFromPassword, hkdfSha256 } from "./kdf.js";
import { generateSalt } from "./random.js";
import { timingSafeEqual } from "./encoding.js";

const TEST_PARAMS = {
  memoryKiB: 16,
  iterations: 1,
  parallelism: 1,
  hashLength: 32,
} as const;

describe("Argon2id KDF", () => {
  it("is deterministic for the same password + salt", async () => {
    const salt = generateSalt();
    const a = await deriveKey("correct horse battery staple", salt, TEST_PARAMS);
    const b = await deriveKey("correct horse battery staple", salt, TEST_PARAMS);
    expect(timingSafeEqual(a, b)).toBe(true);
    expect(a.byteLength).toBe(32);
  });

  it("changes when the salt changes", async () => {
    const a = await deriveKey("password", generateSalt(), TEST_PARAMS);
    const b = await deriveKey("password", generateSalt(), TEST_PARAMS);
    expect(timingSafeEqual(a, b)).toBe(false);
  });

  it("changes when the password changes", async () => {
    const salt = generateSalt();
    const a = await deriveKey("password-a", salt, TEST_PARAMS);
    const b = await deriveKey("password-b", salt, TEST_PARAMS);
    expect(timingSafeEqual(a, b)).toBe(false);
  });

  it("rejects empty passwords and short salts", async () => {
    await expect(deriveKey("", generateSalt(), TEST_PARAMS)).rejects.toThrow();
    await expect(deriveKey("ok", new Uint8Array(8), TEST_PARAMS)).rejects.toThrow();
  });

  it("persists salt inside KDF params for later unlock", async () => {
    const created = await deriveKeyFromPassword("unlock-me", TEST_PARAMS);
    const again = await deriveKeyFromPassword("unlock-me", created.params);
    expect(timingSafeEqual(created.key, again.key)).toBe(true);
    expect(created.params.salt.length).toBeGreaterThan(0);
  });
});

describe("HKDF-SHA-256", () => {
  it("derives a 32-byte key and is domain-separated by info", async () => {
    const ikm = generateSalt(32);
    const salt = generateSalt();
    const enc = await hkdfSha256(ikm, salt, "vault-encryption");
    const auth = await hkdfSha256(ikm, salt, "vault-auth");
    expect(enc.byteLength).toBe(32);
    expect(timingSafeEqual(enc, auth)).toBe(false);
  });
});
