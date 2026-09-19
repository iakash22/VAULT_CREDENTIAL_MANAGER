import {
  decryptString,
  deriveKeyFromPassword,
  encryptString,
  generateVaultKey,
  unwrapKey,
  wrapKey,
} from "@vault/crypto";

export interface SelfTestResult {
  ok: boolean;
  elapsedMs: number;
  message: string;
}

/**
 * Client-only sanity check. Uses a throwaway password and never sends
 * derived keys or ciphertext to the API.
 */
export async function runCryptoSelfTest(): Promise<SelfTestResult> {
  const started = performance.now();
  try {
    const derived = await deriveKeyFromPassword("phase-1-self-test-password");
    const vaultKey = generateVaultKey();
    const wrapped = await wrapKey(vaultKey, derived.key);
    const unwrapped = await unwrapKey(wrapped, derived.key);
    const payload = await encryptString("hello from vault", unwrapped, "self-test");
    const plaintext = await decryptString(payload, unwrapped);

    if (plaintext !== "hello from vault") {
      throw new Error("Plaintext mismatch after decrypt");
    }

    return {
      ok: true,
      elapsedMs: Math.round(performance.now() - started),
      message: "Argon2id + AES-256-GCM + key wrap passed. Nothing left the browser.",
    };
  } catch (error) {
    return {
      ok: false,
      elapsedMs: Math.round(performance.now() - started),
      message: error instanceof Error ? error.message : "Unknown crypto failure",
    };
  }
}
