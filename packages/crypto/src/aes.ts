import { asBufferSource, assertByteLength, fromBase64, toBase64, utf8Decode, utf8Encode } from "./encoding.js";
import { getCrypto, randomBytes } from "./random.js";
import {
  AES_ALGORITHM,
  AES_GCM_IV_BYTES,
  AES_GCM_TAG_BITS,
  AES_KEY_BYTES,
  CRYPTO_VERSION,
  type EncryptedPayload,
} from "./types.js";

function assertPayload(payload: EncryptedPayload): void {
  if (!payload || payload.v !== CRYPTO_VERSION) {
    throw new Error("Unsupported ciphertext version");
  }
  if (payload.alg !== AES_ALGORITHM) {
    throw new Error("Unsupported cipher algorithm");
  }
  if (typeof payload.iv !== "string" || typeof payload.ct !== "string") {
    throw new Error("Ciphertext payload is missing iv or ct");
  }
}

async function importAesKey(rawKey: Uint8Array, usage: "encrypt" | "decrypt"): Promise<CryptoKey> {
  assertByteLength(rawKey, AES_KEY_BYTES, "AES-256-GCM key");
  return getCrypto().subtle.importKey("raw", asBufferSource(rawKey), { name: "AES-GCM" }, false, [usage]);
}

/**
 * WHY AES-256-GCM: confidentiality + integrity in one primitive.
 * A truncated or flipped ciphertext fails decryption instead of returning garbage.
 * IV is random 12 bytes and MUST never be reused with the same key.
 */
export async function encryptAesGcm(
  plaintext: Uint8Array,
  rawKey: Uint8Array,
  aad?: Uint8Array,
): Promise<EncryptedPayload> {
  if (!(plaintext instanceof Uint8Array)) {
    throw new Error("plaintext must be a Uint8Array");
  }

  const iv = randomBytes(AES_GCM_IV_BYTES);
  const key = await importAesKey(rawKey, "encrypt");
  const params: AesGcmParams = {
    name: "AES-GCM",
    iv: asBufferSource(iv),
    tagLength: AES_GCM_TAG_BITS,
  };
  if (aad && aad.byteLength > 0) {
    params.additionalData = asBufferSource(aad);
  }

  const ciphertext = await getCrypto().subtle.encrypt(params, key, asBufferSource(plaintext));
  const payload: EncryptedPayload = {
    v: CRYPTO_VERSION,
    alg: AES_ALGORITHM,
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ciphertext)),
  };
  if (aad && aad.byteLength > 0) {
    payload.aad = toBase64(aad);
  }
  return payload;
}

export async function decryptAesGcm(payload: EncryptedPayload, rawKey: Uint8Array): Promise<Uint8Array> {
  assertPayload(payload);
  const iv = fromBase64(payload.iv);
  assertByteLength(iv, AES_GCM_IV_BYTES, "AES-GCM IV");

  const key = await importAesKey(rawKey, "decrypt");
  const params: AesGcmParams = {
    name: "AES-GCM",
    iv: asBufferSource(iv),
    tagLength: AES_GCM_TAG_BITS,
  };
  if (payload.aad) {
    params.additionalData = asBufferSource(fromBase64(payload.aad));
  }

  try {
    const plaintext = await getCrypto().subtle.decrypt(params, key, asBufferSource(fromBase64(payload.ct)));
    return new Uint8Array(plaintext);
  } catch {
    throw new Error("Decryption failed");
  }
}

export async function encryptString(
  plaintext: string,
  rawKey: Uint8Array,
  aad?: string,
): Promise<EncryptedPayload> {
  if (typeof plaintext !== "string") {
    throw new Error("plaintext must be a string");
  }
  return encryptAesGcm(utf8Encode(plaintext), rawKey, aad ? utf8Encode(aad) : undefined);
}

export async function decryptString(payload: EncryptedPayload, rawKey: Uint8Array): Promise<string> {
  return utf8Decode(await decryptAesGcm(payload, rawKey));
}

/** Encrypt a vault key with the master-derived key. Server stores only the wrapped blob. */
export async function wrapKey(vaultKey: Uint8Array, wrappingKey: Uint8Array): Promise<EncryptedPayload> {
  assertByteLength(vaultKey, AES_KEY_BYTES, "Vault key");
  return encryptAesGcm(vaultKey, wrappingKey);
}

export async function unwrapKey(payload: EncryptedPayload, wrappingKey: Uint8Array): Promise<Uint8Array> {
  const vaultKey = await decryptAesGcm(payload, wrappingKey);
  assertByteLength(vaultKey, AES_KEY_BYTES, "Unwrapped vault key");
  return vaultKey;
}
