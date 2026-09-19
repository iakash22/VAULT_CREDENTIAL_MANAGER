import { decryptString, encryptString } from "./aes.js";
import type { EncryptedPayload } from "./types.js";

export async function encryptJson<T>(
  value: T,
  rawKey: Uint8Array,
  aad?: string,
): Promise<EncryptedPayload> {
  return encryptString(JSON.stringify(value), rawKey, aad);
}

export async function decryptJson<T>(payload: EncryptedPayload, rawKey: Uint8Array): Promise<T> {
  const plaintext = await decryptString(payload, rawKey);
  return JSON.parse(plaintext) as T;
}
