import { describe, expect, it } from "vitest";
import { timingSafeEqual } from "./encoding.js";
import { deriveMasterKeySet } from "./masterKey.js";

const TEST_KDF = {
  memoryKiB: 16,
  iterations: 1,
  parallelism: 1,
  hashLength: 32,
} as const;

describe("master key split", () => {
  it("produces different encryption and auth keys", async () => {
    const keys = await deriveMasterKeySet("a long enough passphrase", TEST_KDF);
    expect(keys.encryptionKey.byteLength).toBe(32);
    expect(keys.authVerifier.byteLength).toBe(32);
    expect(timingSafeEqual(keys.encryptionKey, keys.authVerifier)).toBe(false);
  });

  it("is deterministic for the same password and salt", async () => {
    const first = await deriveMasterKeySet("correct horse battery staple", TEST_KDF);
    const second = await deriveMasterKeySet("correct horse battery staple", first.kdf);
    expect(timingSafeEqual(first.encryptionKey, second.encryptionKey)).toBe(true);
    expect(timingSafeEqual(first.authVerifier, second.authVerifier)).toBe(true);
  });

  it("changes both keys when the password changes", async () => {
    const first = await deriveMasterKeySet("password-one-long", TEST_KDF);
    const second = await deriveMasterKeySet("password-two-long", first.kdf);
    expect(timingSafeEqual(first.encryptionKey, second.encryptionKey)).toBe(false);
    expect(timingSafeEqual(first.authVerifier, second.authVerifier)).toBe(false);
  });
});
