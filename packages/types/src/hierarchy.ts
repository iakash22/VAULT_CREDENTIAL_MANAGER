import type { EntityId } from "./domain.js";

export interface WorkspaceSummary {
  id: EntityId;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspacesResponse {
  workspaces: WorkspaceSummary[];
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface CollectionSummary {
  id: EntityId;
  workspaceId: EntityId;
  parentId: EntityId | null;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionRequest {
  name: string;
  parentId?: string | null;
}

import type { SecretType } from "./secrets.js";

export interface SecretTreeNode {
  id: EntityId;
  title: string;
  secretType: SecretType;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionTreeNode {
  id: EntityId;
  name: string;
  parentId: EntityId | null;
  createdAt: string;
  updatedAt: string;
  children: CollectionTreeNode[];
  secrets: SecretTreeNode[];
}

export interface WorkspaceTreeResponse {
  workspace: WorkspaceSummary;
  tree: CollectionTreeNode[];
  rootSecrets: SecretTreeNode[];
}

