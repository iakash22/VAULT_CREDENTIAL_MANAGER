export const API_VERSION = "v1" as const;

export const API_PATHS = {
  health: `/api/${API_VERSION}/health`,
  ready: `/api/${API_VERSION}/ready`,
  authRegister: `/api/${API_VERSION}/auth/register`,
  authLogin: `/api/${API_VERSION}/auth/login`,
  authKdfParams: `/api/${API_VERSION}/auth/kdf-params`,
  authMe: `/api/${API_VERSION}/auth/me`,
} as const;

export interface HealthResponse {
  status: "ok";
  service: "vault-api";
  version: string;
  phase: number;
  timestamp: string;
}

export interface ReadyResponse {
  status: "ready" | "not_ready";
  checks: {
    database: "ok" | "skipped" | "error";
  };
  timestamp: string;
}

export interface ApiErrorResponse {
  error: string;
}
