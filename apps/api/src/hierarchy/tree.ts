import type { CollectionRecord, SecretMetaRecord } from "./collections.js";

export interface SecretTreeNode {
  id: string;
  title: string;
  secretType: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children: CollectionTreeNode[];
  secrets: SecretTreeNode[];
}

export interface WorkspaceTreeResponse {
  workspace: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  tree: CollectionTreeNode[];
  rootSecrets: SecretTreeNode[];
}

function toIso(date: Date): string {
  return date.toISOString();
}

function mapSecretMeta(row: SecretMetaRecord): SecretTreeNode {
  return {
    id: row.id,
    title: row.title,
    secretType: row.secretType,
    tags: row.tags,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

/**
 * Build a recursive collection tree from flat rows.
 * Secrets without a collection_id appear in rootSecrets.
 */
export function buildWorkspaceTree(
  workspace: { id: string; name: string; createdAt: Date; updatedAt: Date },
  collections: CollectionRecord[],
  secrets: SecretMetaRecord[],
): WorkspaceTreeResponse {
  const nodes = new Map<string, CollectionTreeNode>();
  for (const collection of collections) {
    nodes.set(collection.id, {
      id: collection.id,
      name: collection.name,
      parentId: collection.parentId,
      createdAt: toIso(collection.createdAt),
      updatedAt: toIso(collection.updatedAt),
      children: [],
      secrets: [],
    });
  }

  const roots: CollectionTreeNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const rootSecrets: SecretTreeNode[] = [];
  for (const secret of secrets) {
    const payload = mapSecretMeta(secret);
    if (secret.collectionId && nodes.has(secret.collectionId)) {
      nodes.get(secret.collectionId)!.secrets.push(payload);
    } else {
      rootSecrets.push(payload);
    }
  }

  const sortTree = (items: CollectionTreeNode[]): void => {
    items.sort((a, b) => a.name.localeCompare(b.name));
    for (const item of items) {
      item.secrets.sort((a, b) => a.title.localeCompare(b.title));
      sortTree(item.children);
    }
  };
  sortTree(roots);
  rootSecrets.sort((a, b) => a.title.localeCompare(b.title));

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      createdAt: toIso(workspace.createdAt),
      updatedAt: toIso(workspace.updatedAt),
    },
    tree: roots,
    rootSecrets,
  };
}
