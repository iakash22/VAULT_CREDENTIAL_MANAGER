import type { EncryptedPayload } from "@vault/types";
import type { PrismaClient } from "@prisma/client";

export async function findVaultKeyByUserId(db: PrismaClient, userId: string): Promise<EncryptedPayload | null> {
  const row = await db.userVaultKey.findUnique({ where: { userId } });
  return row ? (row.wrappedKey as unknown as EncryptedPayload) : null;
}

export async function insertVaultKey(
  db: PrismaClient,
  userId: string,
  wrappedKey: EncryptedPayload,
): Promise<void> {
  await db.userVaultKey.create({
    data: { userId, wrappedKey: wrappedKey as object },
  });
}

export async function deleteVaultKeyByUserId(db: PrismaClient, userId: string): Promise<void> {
  await db.userVaultKey.deleteMany({ where: { userId } });
}
