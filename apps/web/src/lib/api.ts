import { API_PATHS, type ApiErrorResponse, type HealthResponse, type ReadyResponse } from "@vault/types";
import { env } from "./env";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function request<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  const response = await fetch(`${env.VITE_API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({ error: "Request failed" }))) as
    | T
    | ApiErrorResponse;

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

export function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>(API_PATHS.health);
}

export function fetchReady(): Promise<ReadyResponse> {
  return request<ReadyResponse>(API_PATHS.ready);
}
