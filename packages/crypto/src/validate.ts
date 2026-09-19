import { fromBase64 } from "./encoding.js";
import {
  AES_ALGORITHM,
  AES_GCM_IV_BYTES,
  AES_GCM_TAG_BITS,
  CRYPTO_VERSION,
  type EncryptedPayload,
} from "./types.js";

/** Minimum decoded ciphertext size: 0-byte plaintext + 128-bit GCM tag. */
const MIN_CIPHERTEXT_BYTES = AES_GCM_TAG_BITS / 8;

/** Reject absurd blobs before they hit JSONB or memory. */
const MAX_CIPHERTEXT_BYTES = 65_536;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Structural validation for ciphertext envelopes stored by the API.
 * The server cannot decrypt — it only checks shape and sane sizes.
 */
export function validateEncryptedPayload(input: unknown): EncryptedPayload {
  if (!isPlainObject(input)) {
    throw new Error("Encrypted payload must be an object");
  }

  if (input.v !== CRYPTO_VERSION) {
    throw new Error("Unsupported ciphertext version");
  }
  if (input.alg !== AES_ALGORITHM) {
    throw new Error("Unsupported cipher algorithm");
  }
  if (typeof input.iv !== "string" || typeof input.ct !== "string") {
    throw new Error("Encrypted payload is missing iv or ct");
  }

  const iv = fromBase64(input.iv);
  if (iv.byteLength !== AES_GCM_IV_BYTES) {
    throw new Error("IV must be exactly 12 bytes");
  }

  const ct = fromBase64(input.ct);
  if (ct.byteLength < MIN_CIPHERTEXT_BYTES) {
    throw new Error("Ciphertext is too short");
  }
  if (ct.byteLength > MAX_CIPHERTEXT_BYTES) {
    throw new Error("Ciphertext exceeds maximum size");
  }

  const payload: EncryptedPayload = {
    v: CRYPTO_VERSION,
    alg: AES_ALGORITHM,
    iv: input.iv,
    ct: input.ct,
  };

  if (input.aad !== undefined) {
    if (typeof input.aad !== "string") {
      throw new Error("aad must be a base64 string when present");
    }
    fromBase64(input.aad);
    payload.aad = input.aad;
  }

  const allowed = new Set(["v", "alg", "iv", "ct", "aad"]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      throw new Error(`Unknown field in encrypted payload: ${key}`);
    }
  }

  return payload;
}
