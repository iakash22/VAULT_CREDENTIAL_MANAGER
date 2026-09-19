import { deriveMasterKeySet, runEncryptDecryptFlow } from "@vault/crypto";

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
    const password = "phase-3-self-test-password-long";
    const flow = await runEncryptDecryptFlow(password);
    const keys = await deriveMasterKeySet(password);
    if (keys.kdf.algorithm !== "argon2id") {
      throw new Error("Expected Argon2id KDF");
    }
    if (flow.decryptedSecret.title !== "Example login") {
      throw new Error("Plaintext mismatch after decrypt");
    }

    return {
      ok: true,
      elapsedMs: Math.round(performance.now() - started),
      message: "Argon2id + AES-256-GCM + vault key wrap + JSON encrypt passed. Nothing left the browser.",
    };
  } catch (error) {
    return {
      ok: false,
      elapsedMs: Math.round(performance.now() - started),
      message: error instanceof Error ? error.message : "Unknown crypto failure",
    };
  }
}
