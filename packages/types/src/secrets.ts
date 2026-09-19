import type { EntityId } from "./domain.js";
import type { EncryptedPayload } from "./crypto.js";

export const SECRET_TYPES = ["password", "ssh", "token", "env"] as const;
export type SecretType = (typeof SECRET_TYPES)[number];

/** Plaintext fields encrypted inside the blob — never sent unencrypted. */
export interface PasswordSecretData {
  username?: string;
  password?: string;
  uri?: string;
  notes?: string;
}

export interface SshSecretData {
  privateKey?: string;
  publicKey?: string;
  host?: string;
  passphrase?: string;
  notes?: string;
}

export interface TokenSecretData {
  token?: string;
  issuer?: string;
  notes?: string;
}

export interface EnvSecretData {
  entries?: Array<{ key: string; value: string }>;
  notes?: string;
}

export type SecretPayload =
  | ({ type: "password" } & PasswordSecretData)
  | ({ type: "ssh" } & SshSecretData)
  | ({ type: "token" } & TokenSecretData)
  | ({ type: "env" } & EnvSecretData);

export interface CreateSecretRequest {
  title: string;
  tags?: string[];
  secretType: SecretType;
  collectionId?: string | null;
  encryptedPayload: EncryptedPayload;
}

export interface SecretSummary {
  id: EntityId;
  workspaceId: EntityId;
  collectionId: EntityId | null;
  title: string;
  secretType: SecretType;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SecretDetail extends SecretSummary {
  encryptedPayload: EncryptedPayload;
}

export interface SecretsListResponse {
  secrets: SecretSummary[];
}

export interface SearchSecretsQuery {
  q?: string;
  type?: SecretType;
  tag?: string;
}

export interface SearchSecretsResponse {
  secrets: SecretSummary[];
  query: SearchSecretsQuery;
}

export const SECRET_TYPE_LABELS: Record<SecretType, string> = {
  password: "Password",
  ssh: "SSH key",
  token: "Token",
  env: "Environment",
};
