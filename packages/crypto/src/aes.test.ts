import { describe, expect, it } from "vitest";
import { decryptString, encryptString, unwrapKey, wrapKey } from "./aes.js";
import { fromBase64, toBase64 } from "./encoding.js";
import { generateVaultKey } from "./random.js";

describe("AES-256-GCM", () => {
  it("round-trips a string", async () => {
    const key = generateVaultKey();
    const payload = await encryptString("zero-knowledge", key);
    await expect(decryptString(payload, key)).resolves.toBe("zero-knowledge");
  });

  it("produces a different ciphertext each time (unique IV)", async () => {
    const key = generateVaultKey();
    const a = await encryptString("same-plaintext", key);
    const b = await encryptString("same-plaintext", key);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ct).not.toBe(b.ct);
  });

  it("fails closed when ciphertext is tampered", async () => {
    const key = generateVaultKey();
    const payload = await encryptString("secret", key);
    const ciphertext = fromBase64(payload.ct);
    ciphertext[0] = (ciphertext[0] ?? 0) ^ 0xff;
    const tampered = { ...payload, ct: toBase64(ciphertext) };
    await expect(decryptString(tampered, key)).rejects.toThrow("Decryption failed");
  });

  it("fails closed with the wrong key", async () => {
    const payload = await encryptString("secret", generateVaultKey());
    await expect(decryptString(payload, generateVaultKey())).rejects.toThrow("Decryption failed");
  });

  it("wraps and unwraps a vault key", async () => {
    const vaultKey = generateVaultKey();
    const masterKey = generateVaultKey();
    const wrapped = await wrapKey(vaultKey, masterKey);
    const unwrapped = await unwrapKey(wrapped, masterKey);
    expect(Array.from(unwrapped)).toEqual(Array.from(vaultKey));
  });

  it("binds optional AAD so swapping context fails", async () => {
    const key = generateVaultKey();
    const payload = await encryptString("secret", key, "workspace-a");
    const swapped = { ...payload, aad: btoa("workspace-b") };
    await expect(decryptString(swapped, key)).rejects.toThrow("Decryption failed");
  });
});
