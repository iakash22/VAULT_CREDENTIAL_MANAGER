import { API_PATHS, type PutVaultKeyRequest, type VaultKeyResponse } from "@vault/types";
import { request } from "./api";

export function fetchVaultKey(token: string): Promise<VaultKeyResponse> {
  return request<VaultKeyResponse>(API_PATHS.vaultKey, { token });
}

export function storeVaultKey(token: string, wrappedKey: PutVaultKeyRequest["wrappedKey"]): Promise<VaultKeyResponse> {
  return request<VaultKeyResponse>(API_PATHS.vaultKey, {
    method: "PUT",
    token,
    body: JSON.stringify({ wrappedKey } satisfies PutVaultKeyRequest),
  });
}
