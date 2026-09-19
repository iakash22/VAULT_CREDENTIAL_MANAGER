import { decryptString, encryptString, unwrapKey, wrapKey } from "./aes.js";
import { decryptJson, encryptJson } from "./json.js";
import { deriveMasterKeySet } from "./masterKey.js";
import { generateVaultKey } from "./random.js";
import type { EncryptedPayload } from "./types.js";

export interface ExampleSecret {
  title: string;
  username?: string;
  password?: string;
}

export interface EncryptDecryptFlowResult {
  masterKeys: Awaited<ReturnType<typeof deriveMasterKeySet>>;
  vaultKey: Uint8Array;
  wrappedVaultKey: EncryptedPayload;
  encryptedSecret: EncryptedPayload;
  decryptedSecret: ExampleSecret;
}

/**
 * End-to-end example: master password → vault key wrap → secret encrypt/decrypt.
 * Runs entirely client-side; only EncryptedPayload blobs would be sent to the API.
 */
export async function runEncryptDecryptFlow(
  masterPassword: string,
): Promise<EncryptDecryptFlowResult> {
  const masterKeys = await deriveMasterKeySet(masterPassword);
  const vaultKey = generateVaultKey();
  const wrappedVaultKey = await wrapKey(vaultKey, masterKeys.encryptionKey);

  const secret: ExampleSecret = {
    title: "Example login",
    username: "demo@example.com",
    password: "never-sent-in-plaintext",
  };

  const encryptedSecret = await encryptJson(secret, vaultKey, "secret-v1");
  const decryptedSecret = await decryptJson<ExampleSecret>(encryptedSecret, vaultKey);

  return {
    masterKeys,
    vaultKey,
    wrappedVaultKey,
    encryptedSecret,
    decryptedSecret,
  };
}

/** Minimal string encrypt/decrypt without JSON wrapping. */
export async function runStringEncryptDecryptExample(
  plaintext: string,
  key: Uint8Array,
): Promise<{ payload: EncryptedPayload; decrypted: string }> {
  const payload = await encryptString(plaintext, key);
  const decrypted = await decryptString(payload, key);
  return { payload, decrypted };
}

/** Vault key persistence shape the API stores (opaque to the server). */
export async function runVaultKeyWrapExample(
  encryptionKey: Uint8Array,
): Promise<{ vaultKey: Uint8Array; wrapped: EncryptedPayload; unwrapped: Uint8Array }> {
  const vaultKey = generateVaultKey();
  const wrapped = await wrapKey(vaultKey, encryptionKey);
  const unwrapped = await unwrapKey(wrapped, encryptionKey);
  return { vaultKey, wrapped, unwrapped };
}
