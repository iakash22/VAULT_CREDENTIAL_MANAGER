import {
  decryptJson,
  encryptJson,
  generateVaultKey,
  unwrapKey,
  wrapKey,
  type EncryptedPayload,
} from "@vault/crypto";
import type { SecretPayload } from "@vault/types";

/** Generate a random vault key and wrap it with the master-derived encryption key. */
export async function createWrappedVaultKey(encryptionKey: Uint8Array): Promise<{
  vaultKey: Uint8Array;
  wrappedKey: EncryptedPayload;
}> {
  const vaultKey = generateVaultKey();
  const wrappedKey = await wrapKey(vaultKey, encryptionKey);
  return { vaultKey, wrappedKey };
}

/** Unwrap the server-stored vault key blob using the master-derived encryption key. */
export async function unlockVaultKey(
  encryptionKey: Uint8Array,
  wrappedKey: EncryptedPayload,
): Promise<Uint8Array> {
  return unwrapKey(wrappedKey, encryptionKey);
}

/** Encrypt sensitive secret fields. Title/tags stay as searchable metadata on the server. */
export async function encryptSecretPayload(
  vaultKey: Uint8Array,
  payload: SecretPayload,
): Promise<EncryptedPayload> {
  return encryptJson(payload, vaultKey, `secret-${payload.type}-v1`);
}

/** Decrypt a stored secret blob back to typed payload. */
export async function decryptSecretPayload(
  vaultKey: Uint8Array,
  encrypted: EncryptedPayload,
): Promise<SecretPayload> {
  return decryptJson<SecretPayload>(encrypted, vaultKey);
}
