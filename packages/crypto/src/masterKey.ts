import { fromBase64, toBase64 } from "./encoding.js";
import { deriveKeyFromPassword, hkdfSha256 } from "./kdf.js";
import type { KdfParams } from "./types.js";

/**
 * Domain-separation labels. Changing these makes every existing account
 * unable to derive the same keys — treat them as permanent.
 */
export const HKDF_INFO_ENCRYPTION = "vault-encryption-v1";
export const HKDF_INFO_AUTH = "vault-auth-v1";

export interface MasterKeySet {
  /** AES-256 key. NEVER sent to the API. NEVER written to disk or the database. */
  encryptionKey: Uint8Array;
  /** Login material only. Safe to send over HTTPS because it cannot decrypt the vault. */
  authVerifier: Uint8Array;
  kdf: KdfParams;
}

/**
 * WHY two keys: Argon2id(password) is strong key material. If that exact
 * 32-byte value were stored or sent as the "password hash", the server
 * would hold the encryption key and zero-knowledge would be a lie.
 *
 * HKDF splits the Argon2id output into two unrelated keys:
 *   encryption key  → stays in the browser
 *   auth verifier   → sent once, then Argon2id-hashed again on the server
 */
export async function deriveMasterKeySet(
  password: string,
  existing?: Partial<KdfParams>,
): Promise<MasterKeySet> {
  const derived = await deriveKeyFromPassword(password, existing);
  const salt = fromBase64(derived.params.salt);
  const [encryptionKey, authVerifier] = await Promise.all([
    hkdfSha256(derived.key, salt, HKDF_INFO_ENCRYPTION),
    hkdfSha256(derived.key, salt, HKDF_INFO_AUTH),
  ]);

  return {
    encryptionKey,
    authVerifier,
    kdf: derived.params,
  };
}

export function encodeAuthVerifier(verifier: Uint8Array): string {
  return toBase64(verifier);
}
