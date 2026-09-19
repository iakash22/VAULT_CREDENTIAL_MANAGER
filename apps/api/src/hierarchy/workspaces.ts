import type { PrismaClient } from "@prisma/client";

export interface WorkspaceRecord {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

function mapWorkspace(row: {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): WorkspaceRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findWorkspaceForUser(
  db: PrismaClient,
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRecord | null> {
  const row = await db.workspace.findFirst({
    where: { id: workspaceId, userId },
  });
  return row ? mapWorkspace(row) : null;
}

export async function listWorkspacesForUser(db: PrismaClient, userId: string): Promise<WorkspaceRecord[]> {
  const rows = await db.workspace.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(mapWorkspace);
}

export async function createWorkspace(
  db: PrismaClient,
  userId: string,
  name: string,
): Promise<WorkspaceRecord> {
  const row = await db.workspace.create({
    data: { userId, name },
  });
  return mapWorkspace(row);
}
