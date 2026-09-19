import type { SecretType } from "@vault/types";
import type { PrismaClient } from "@prisma/client";

export interface CollectionRecord {
  id: string;
  workspaceId: string;
  userId: string;
  parentId: string | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecretMetaRecord {
  id: string;
  workspaceId: string;
  collectionId: string | null;
  title: string;
  secretType: SecretType;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

function mapCollection(row: {
  id: string;
  workspaceId: string;
  userId: string;
  parentId: string | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): CollectionRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    parentId: row.parentId,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findCollectionForUser(
  db: PrismaClient,
  collectionId: string,
  userId: string,
  workspaceId: string,
): Promise<CollectionRecord | null> {
  const row = await db.collection.findFirst({
    where: { id: collectionId, userId, workspaceId },
  });
  return row ? mapCollection(row) : null;
}

export async function createCollection(
  db: PrismaClient,
  input: {
    workspaceId: string;
    userId: string;
    name: string;
    parentId?: string | null;
  },
): Promise<CollectionRecord> {
  const row = await db.collection.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      name: input.name,
      parentId: input.parentId ?? null,
    },
  });
  return mapCollection(row);
}

export async function listCollectionsInWorkspace(
  db: PrismaClient,
  workspaceId: string,
  userId: string,
): Promise<CollectionRecord[]> {
  const rows = await db.collection.findMany({
    where: { workspaceId, userId },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
  return rows.map(mapCollection);
}

export async function listSecretMetaInWorkspace(
  db: PrismaClient,
  workspaceId: string,
  userId: string,
): Promise<SecretMetaRecord[]> {
  const rows = await db.secret.findMany({
    where: { workspaceId, userId },
    select: {
      id: true,
      workspaceId: true,
      collectionId: true,
      title: true,
      secretType: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return rows;
}
