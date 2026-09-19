/**
 * Domain model for later phases. Phase 1 does not persist these.
 * Hierarchy: Workspace → Collections → Secrets
 */
export type EntityId = string;

export interface Workspace {
  id: EntityId;
  name: string;
  createdAt: string;
}

export interface Collection {
  id: EntityId;
  workspaceId: EntityId;
  name: string;
  createdAt: string;
}

/**
 * A secret as the client sees it AFTER decryption.
 * The server only ever stores EncryptedPayload blobs.
 */
export interface SecretDraft {
  title: string;
  username?: string;
  password?: string;
  notes?: string;
  uri?: string;
}

export const PHASE = 10;
export const APP_NAME = "Vault";
export const APP_VERSION = "0.1.0";
