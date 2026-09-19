import { AES_KEY_BYTES, KDF_SALT_BYTES } from "./types.js";

export function getCrypto(): Crypto {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues || !cryptoApi.subtle) {
    throw new Error(
      "Web Crypto API is unavailable. Use Node 20+ or a secure context (HTTPS / localhost).",
    );
  }
  return cryptoApi;
}

export function randomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error("length must be a positive integer");
  }
  const bytes = new Uint8Array(length);
  getCrypto().getRandomValues(bytes);
  return bytes;
}

export function generateSalt(length = KDF_SALT_BYTES): Uint8Array {
  return randomBytes(length);
}

/** Random AES-256 vault key. Exists only in memory until wrapped (encrypted) by the master key. */
export function generateVaultKey(): Uint8Array {
  return randomBytes(AES_KEY_BYTES);
}
