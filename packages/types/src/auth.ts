export const MASTER_PASSWORD_MIN = 12;
export const MASTER_PASSWORD_MAX = 128;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 32;
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export interface PublicKdfParams {
  algorithm: "argon2id";
  salt: string;
  memoryKiB: number;
  iterations: number;
  parallelism: number;
  hashLength: number;
}

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthSessionResponse {
  token: string;
  expiresIn: number;
  user: AuthUser;
}

export interface KdfParamsResponse {
  kdf: PublicKdfParams;
}

export interface RegisterRequest {
  username: string;
  authVerifier: string;
  kdf: PublicKdfParams;
}

export interface LoginRequest {
  username: string;
  authVerifier: string;
}

export function validateMasterPassword(password: string): string | null {
  if (typeof password !== "string") {
    return "Password is required";
  }
  if (password.length < MASTER_PASSWORD_MIN) {
    return `Use at least ${MASTER_PASSWORD_MIN} characters. A short phrase is stronger than a tiny complex password.`;
  }
  if (password.length > MASTER_PASSWORD_MAX) {
    return `Password must be at most ${MASTER_PASSWORD_MAX} characters`;
  }
  if (password.trim() !== password) {
    return "Password cannot start or end with spaces";
  }
  return null;
}

export function validateUsername(username: string): string | null {
  const value = username.trim();
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters`;
  }
  if (!USERNAME_PATTERN.test(value)) {
    return "Username can only contain letters, numbers, dots, underscores, and hyphens";
  }
  return null;
}
