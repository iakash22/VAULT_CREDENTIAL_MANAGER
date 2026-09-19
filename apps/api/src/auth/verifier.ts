import { deriveKey, fromBase64, generateSalt, toBase64, timingSafeEqual } from "@vault/crypto";

const SERVER_HASH_PARAMS = {
  memoryKiB: 19_456,
  iterations: 2,
  parallelism: 1,
  hashLength: 32,
} as const;

/** Hash the client auth verifier. The encryption key is never an input here. */
export async function hashAuthVerifier(authVerifierB64: string, saltB64?: string) {
  const verifier = fromBase64(authVerifierB64);
  const salt = saltB64 ? fromBase64(saltB64) : generateSalt();
  const hash = await deriveKey(verifier, salt, SERVER_HASH_PARAMS);
  return {
    hash: toBase64(hash),
    salt: saltB64 ?? toBase64(salt),
  };
}

export function verifiersMatch(computedHash: string, storedHash: string): boolean {
  return timingSafeEqual(fromBase64(computedHash), fromBase64(storedHash));
}
