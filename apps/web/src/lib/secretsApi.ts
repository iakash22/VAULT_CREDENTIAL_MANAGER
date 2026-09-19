import {
  API_PATHS,
  type CreateSecretRequest,
  type SearchSecretsQuery,
  type SearchSecretsResponse,
  type SecretDetail,
  type SecretSummary,
  type SecretsListResponse,
} from "@vault/types";
import { request } from "./api";

export function listSecrets(token: string, workspaceId: string): Promise<SecretsListResponse> {
  return request<SecretsListResponse>(API_PATHS.workspaceSecrets(workspaceId), { token });
}

export function searchSecrets(
  token: string,
  workspaceId: string,
  query: SearchSecretsQuery,
): Promise<SearchSecretsResponse> {
  const params = new URLSearchParams();
  if (query.q) {
    params.set("q", query.q);
  }
  if (query.type) {
    params.set("type", query.type);
  }
  if (query.tag) {
    params.set("tag", query.tag);
  }
  const qs = params.toString();
  const path = qs
    ? `${API_PATHS.workspaceSecretSearch(workspaceId)}?${qs}`
    : API_PATHS.workspaceSecretSearch(workspaceId);
  return request<SearchSecretsResponse>(path, { token });
}

export function createSecret(
  token: string,
  workspaceId: string,
  body: CreateSecretRequest,
): Promise<SecretSummary> {
  return request<SecretSummary>(API_PATHS.workspaceSecrets(workspaceId), {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function getSecret(token: string, secretId: string): Promise<SecretDetail> {
  return request<SecretDetail>(API_PATHS.secret(secretId), { token });
}

export function deleteSecret(token: string, secretId: string): Promise<void> {
  return request<void>(API_PATHS.secret(secretId), { method: "DELETE", token });
}
