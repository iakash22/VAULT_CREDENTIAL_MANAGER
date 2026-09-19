export const CRYPTO_VERSION = 1 as const;
export const AES_ALGORITHM = "AES-256-GCM" as const;
export const KDF_ALGORITHM = "argon2id" as const;

/** AES-256 key size. Never store this value — only keep it in memory. */
export const AES_KEY_BYTES = 32;

/** 96-bit IV is the NIST-recommended size for AES-GCM. Must be unique per encryption. */
export const AES_GCM_IV_BYTES = 12;

/** 128-bit auth tag so tampering is detected on decrypt. */
export const AES_GCM_TAG_BITS = 128;

/** Argon2id requires >= 8 bytes; 16 bytes is the common minimum for password salts. */
export const KDF_SALT_BYTES = 16;

/**
 * OWASP 2023 interactive recommendation for Argon2id.
 * WHY these numbers: memory-hard enough to slow GPUs, still usable on phones.
 * Increase later if unlock latency on target devices stays under ~1s.
 */
export const KDF_DEFAULTS = {
  algorithm: KDF_ALGORITHM,
  memoryKiB: 19_456,
  iterations: 2,
  parallelism: 1,
  hashLength: AES_KEY_BYTES,
} as const;

export interface KdfParams {
  algorithm: typeof KDF_ALGORITHM;
  memoryKiB: number;
  iterations: number;
  parallelism: number;
  hashLength: number;
  /** Base64-encoded random salt. Public — stored next to the verifier, never secret. */
  salt: string;
}

/**
 * Versioned ciphertext envelope stored by the backend as an opaque blob.
 * The server must treat this as unreadable JSON — it has no key.
 */
export interface EncryptedPayload {
  v: typeof CRYPTO_VERSION;
  alg: typeof AES_ALGORITHM;
  iv: string;
  ct: string;
  /** Optional additional authenticated data (not secret, integrity-protected). */
  aad?: string;
}

export interface DerivedKey {
  key: Uint8Array;
  params: KdfParams;
}
