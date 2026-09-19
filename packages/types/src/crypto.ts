/** Versioned ciphertext envelope — opaque to the server. Defined in @vault/crypto. */
export interface EncryptedPayload {
  v: 1;
  alg: "AES-256-GCM";
  iv: string;
  ct: string;
  aad?: string;
}

export interface VaultKeyResponse {
  wrappedKey: EncryptedPayload;
}

export interface PutVaultKeyRequest {
  wrappedKey: EncryptedPayload;
}
