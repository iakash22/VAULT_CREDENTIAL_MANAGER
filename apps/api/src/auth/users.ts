import type { PublicKdfParams } from "@vault/types";
import type { PrismaClient } from "@prisma/client";

export interface UserRecord {
  id: string;
  username: string;
  authHash: string;
  authSalt: string;
  kdf: PublicKdfParams;
  failedLogins: number;
  lockedUntil: Date | null;
}

function mapUser(row: {
  id: string;
  username: string;
  authHash: string;
  authSalt: string;
  kdfAlgorithm: string;
  kdfSalt: string;
  kdfMemoryKib: number;
  kdfIterations: number;
  kdfParallelism: number;
  kdfHashLength: number;
  failedLogins: number;
  lockedUntil: Date | null;
}): UserRecord {
  return {
    id: row.id,
    username: row.username,
    authHash: row.authHash,
    authSalt: row.authSalt,
    failedLogins: row.failedLogins,
    lockedUntil: row.lockedUntil,
    kdf: {
      algorithm: "argon2id",
      salt: row.kdfSalt,
      memoryKiB: row.kdfMemoryKib,
      iterations: row.kdfIterations,
      parallelism: row.kdfParallelism,
      hashLength: row.kdfHashLength,
    },
  };
}

export async function countUsers(db: PrismaClient): Promise<number> {
  return db.user.count();
}

export async function findUserByUsername(db: PrismaClient, username: string): Promise<UserRecord | null> {
  const row = await db.user.findUnique({ where: { username } });
  return row ? mapUser(row) : null;
}

export async function insertUser(
  db: PrismaClient,
  input: {
    username: string;
    authHash: string;
    authSalt: string;
    kdf: PublicKdfParams;
  },
): Promise<UserRecord> {
  const row = await db.user.create({
    data: {
      username: input.username,
      authHash: input.authHash,
      authSalt: input.authSalt,
      kdfAlgorithm: input.kdf.algorithm,
      kdfSalt: input.kdf.salt,
      kdfMemoryKib: input.kdf.memoryKiB,
      kdfIterations: input.kdf.iterations,
      kdfParallelism: input.kdf.parallelism,
      kdfHashLength: input.kdf.hashLength,
    },
  });
  return mapUser(row);
}

export async function recordFailedLogin(
  db: PrismaClient,
  userId: string,
  threshold: number,
  lockMinutes: number,
): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const failedLogins = user.failedLogins + 1;
  await db.user.update({
    where: { id: userId },
    data: {
      failedLogins,
      lockedUntil:
        failedLogins >= threshold ? new Date(Date.now() + lockMinutes * 60_000) : user.lockedUntil,
    },
  });
}

export async function resetFailedLogins(db: PrismaClient, userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { failedLogins: 0, lockedUntil: null },
  });
}

export async function deleteUserByUsername(db: PrismaClient, username: string): Promise<void> {
  await db.user.deleteMany({ where: { username } });
}
