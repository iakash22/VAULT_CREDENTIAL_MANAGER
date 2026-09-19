import type { EncryptedPayload, SecretSummary, SecretType } from "@vault/types";
import type { Prisma, PrismaClient } from "@prisma/client";

function mapSecret(row: {
  id: string;
  workspaceId: string;
  collectionId: string | null;
  secretType: SecretType;
  title: string;
  tags: string[];
  encryptedPayload: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): SecretSummary & { encryptedPayload: EncryptedPayload } {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    collectionId: row.collectionId,
    secretType: row.secretType,
    title: row.title,
    tags: row.tags,
    encryptedPayload: row.encryptedPayload as unknown as EncryptedPayload,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toSummary(
  row: SecretSummary & { encryptedPayload?: EncryptedPayload },
): SecretSummary {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    collectionId: row.collectionId,
    secretType: row.secretType,
    title: row.title,
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createSecret(
  db: PrismaClient,
  input: {
    workspaceId: string;
    userId: string;
    collectionId?: string | null;
    secretType: SecretType;
    title: string;
    tags: string[];
    encryptedPayload: EncryptedPayload;
  },
): Promise<SecretSummary & { encryptedPayload: EncryptedPayload }> {
  const row = await db.secret.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      collectionId: input.collectionId ?? null,
      secretType: input.secretType,
      title: input.title,
      tags: input.tags,
      encryptedPayload: input.encryptedPayload as object,
    },
  });
  return mapSecret(row);
}

export async function findSecretForUser(
  db: PrismaClient,
  secretId: string,
  userId: string,
): Promise<(SecretSummary & { encryptedPayload: EncryptedPayload }) | null> {
  const row = await db.secret.findFirst({
    where: { id: secretId, userId },
  });
  return row ? mapSecret(row) : null;
}

export async function deleteSecretForUser(
  db: PrismaClient,
  secretId: string,
  userId: string,
): Promise<boolean> {
  const result = await db.secret.deleteMany({
    where: { id: secretId, userId },
  });
  return result.count > 0;
}

export async function listSecretsInWorkspace(
  db: PrismaClient,
  workspaceId: string,
  userId: string,
): Promise<SecretSummary[]> {
  const rows = await db.secret.findMany({
    where: { workspaceId, userId },
    orderBy: [{ title: "asc" }, { createdAt: "desc" }],
  });
  return rows.map((row) => toSummary(mapSecret(row)));
}

export async function searchSecretsInWorkspace(
  db: PrismaClient,
  workspaceId: string,
  userId: string,
  query: { q?: string; type?: SecretType; tag?: string },
): Promise<SecretSummary[]> {
  const where: Prisma.SecretWhereInput = {
    workspaceId,
    userId,
  };

  if (query.type) {
    where.secretType = query.type;
  }
  if (query.tag) {
    where.tags = { has: query.tag };
  }
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { tags: { has: query.q.toLowerCase() } },
    ];
  }

  const rows = await db.secret.findMany({
    where,
    orderBy: [{ title: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
  return rows.map((row) => toSummary(mapSecret(row)));
}
