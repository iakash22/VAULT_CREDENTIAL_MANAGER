import {
  API_PATHS,
  type AuthSessionResponse,
  type AuthUser,
  type KdfParamsResponse,
  type PublicKdfParams,
} from "@vault/types";
import { request } from "./api";

export function fetchKdfParams(username: string): Promise<KdfParamsResponse> {
  const query = new URLSearchParams({ username });
  return request<KdfParamsResponse>(`${API_PATHS.authKdfParams}?${query.toString()}`);
}

export function registerAccount(
  username: string,
  authVerifier: string,
  kdf: PublicKdfParams,
): Promise<AuthSessionResponse> {
  return request<AuthSessionResponse>(API_PATHS.authRegister, {
    method: "POST",
    body: JSON.stringify({ username, authVerifier, kdf }),
  });
}

export function loginAccount(username: string, authVerifier: string): Promise<AuthSessionResponse> {
  return request<AuthSessionResponse>(API_PATHS.authLogin, {
    method: "POST",
    body: JSON.stringify({ username, authVerifier }),
  });
}

export function fetchMe(token: string): Promise<AuthUser> {
  return request<AuthUser>(API_PATHS.authMe, { token });
}
