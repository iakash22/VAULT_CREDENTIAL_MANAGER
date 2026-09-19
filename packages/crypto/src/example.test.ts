import { describe, expect, it } from "vitest";
import {
  runEncryptDecryptFlow,
  runStringEncryptDecryptExample,
  runVaultKeyWrapExample,
} from "./example.js";
import { generateVaultKey } from "./random.js";

describe("encrypt/decrypt example flow", () => {
  it("runs master password → vault key → secret round-trip", async () => {
    const result = await runEncryptDecryptFlow("example-master-password-long-enough");
    expect(result.decryptedSecret.title).toBe("Example login");
    expect(result.wrappedVaultKey.v).toBe(1);
    expect(result.encryptedSecret.alg).toBe("AES-256-GCM");
  });

  it("wraps and unwraps a vault key", async () => {
    const encryptionKey = generateVaultKey();
    const { vaultKey, unwrapped } = await runVaultKeyWrapExample(encryptionKey);
    expect(Array.from(unwrapped)).toEqual(Array.from(vaultKey));
  });

  it("encrypts and decrypts a string", async () => {
    const key = generateVaultKey();
    const { decrypted } = await runStringEncryptDecryptExample("hello vault", key);
    expect(decrypted).toBe("hello vault");
  });
});
