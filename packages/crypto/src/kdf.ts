import { argon2id } from "hash-wasm";
import { asBufferSource, fromBase64, toBase64 } from "./encoding.js";
import { generateSalt } from "./random.js";
import {
  AES_KEY_BYTES,
  KDF_DEFAULTS,
  KDF_SALT_BYTES,
  type DerivedKey,
  type KdfParams,
} from "./types.js";

function assertPassword(password: string | Uint8Array): void {
  if (typeof password === "string") {
    if (password.length === 0) {
      throw new Error("Password must be a non-empty string");
    }
    return;
  }
  if (!(password instanceof Uint8Array) || password.byteLength === 0) {
    throw new Error("Password material must be a non-empty Uint8Array");
  }
}

function normalizeParams(input?: Partial<KdfParams>): Omit<KdfParams, "salt"> {
  const memoryKiB = input?.memoryKiB ?? KDF_DEFAULTS.memoryKiB;
  const iterations = input?.iterations ?? KDF_DEFAULTS.iterations;
  const parallelism = input?.parallelism ?? KDF_DEFAULTS.parallelism;
  const hashLength = input?.hashLength ?? KDF_DEFAULTS.hashLength;

  if (!Number.isInteger(memoryKiB) || memoryKiB < 8) {
    throw new Error("Argon2id memoryKiB must be an integer >= 8");
  }
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error("Argon2id iterations must be an integer >= 1");
  }
  if (!Number.isInteger(parallelism) || parallelism < 1) {
    throw new Error("Argon2id parallelism must be an integer >= 1");
  }
  if (!Number.isInteger(hashLength) || hashLength < 16 || hashLength > 64) {
    throw new Error("Argon2id hashLength must be an integer between 16 and 64");
  }

  return {
    algorithm: "argon2id",
    memoryKiB,
    iterations,
    parallelism,
    hashLength,
  };
}

/**
 * WHY Argon2id: memory-hard, hybrid of Argon2i (side-channel resistant) and
 * Argon2d (GPU-resistant). Winner of the Password Hashing Competition.
 * A fast hash (SHA-256) of a master password is brute-forceable; Argon2id is not.
 *
 * The raw Argon2id output is intermediate key material. Split it with HKDF
 * before using it as an encryption key or an auth verifier.
 */
export async function deriveKey(
  password: string | Uint8Array,
  salt: Uint8Array,
  params?: Partial<Omit<KdfParams, "salt">>,
): Promise<Uint8Array> {
  assertPassword(password);
  if (!(salt instanceof Uint8Array) || salt.byteLength < KDF_SALT_BYTES) {
    throw new Error(`Argon2id salt must be at least ${KDF_SALT_BYTES} bytes`);
  }

  const normalized = normalizeParams(params);
  return argon2id({
    password,
    salt,
    parallelism: normalized.parallelism,
    iterations: normalized.iterations,
    memorySize: normalized.memoryKiB,
    hashLength: normalized.hashLength,
    outputType: "binary",
  });
}

export async function deriveKeyFromPassword(
  password: string,
  existing?: Partial<KdfParams>,
): Promise<DerivedKey> {
  const salt = existing?.salt ? fromBase64(existing.salt) : generateSalt();
  const params = normalizeParams(existing);
  const key = await deriveKey(password, salt, params);

  return {
    key,
    params: {
      ...params,
      salt: existing?.salt ?? toBase64(salt),
    },
  };
}

/** HKDF-SHA-256 stretch. Used later to split "auth hash material" from "encryption key". */
export async function hkdfSha256(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: string,
  length = AES_KEY_BYTES,
): Promise<Uint8Array> {
  if (!(ikm instanceof Uint8Array) || ikm.byteLength === 0) {
    throw new Error("HKDF input key material must be a non-empty Uint8Array");
  }
  if (!Number.isInteger(length) || length < 16 || length > 255) {
    throw new Error("HKDF length must be an integer between 16 and 255");
  }

  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error("Web Crypto API is unavailable");
  }

  const imported = await cryptoApi.subtle.importKey("raw", asBufferSource(ikm), "HKDF", false, ["deriveBits"]);
  const bits = await cryptoApi.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: asBufferSource(salt),
      info: new TextEncoder().encode(info),
    },
    imported,
    length * 8,
  );

  return new Uint8Array(bits);
}
