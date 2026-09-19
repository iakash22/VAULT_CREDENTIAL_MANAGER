import { createHmac } from "node:crypto";
import { KDF_DEFAULTS, type KdfParams } from "@vault/crypto";

/**
 * WHY: returning 404 for an unknown username lets attackers enumerate accounts.
 * A stable dummy salt (HMAC of the username) keeps the response shape identical.
 */
export function dummyKdfParams(username: string, secret: string): KdfParams {
  const salt = createHmac("sha256", secret).update(`kdf-dummy:${username}`).digest().subarray(0, 16);

  return {
    algorithm: "argon2id",
    salt: salt.toString("base64"),
    memoryKiB: KDF_DEFAULTS.memoryKiB,
    iterations: KDF_DEFAULTS.iterations,
    parallelism: KDF_DEFAULTS.parallelism,
    hashLength: KDF_DEFAULTS.hashLength,
  };
}
