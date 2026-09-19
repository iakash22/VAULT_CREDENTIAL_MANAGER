import type { PublicKdfParams } from "@vault/types";
import type { Pool } from "pg";

export interface UserRecord {
  id: string;
  username: string;
  authHash: string;
  authSalt: string;
  kdf: PublicKdfParams;
  failedLogins: number;
  lockedUntil: Date | null;
}

interface UserRow {
  id: string;
  username: string;
  auth_hash: string;
  auth_salt: string;
  kdf_algorithm: "argon2id";
  kdf_salt: string;
  kdf_memory_kib: number;
  kdf_iterations: number;
  kdf_parallelism: number;
  kdf_hash_length: number;
  failed_logins: number;
  locked_until: Date | null;
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    username: row.username,
    authHash: row.auth_hash,
    authSalt: row.auth_salt,
    failedLogins: row.failed_logins,
    lockedUntil: row.locked_until,
    kdf: {
      algorithm: row.kdf_algorithm,
      salt: row.kdf_salt,
      memoryKiB: row.kdf_memory_kib,
      iterations: row.kdf_iterations,
      parallelism: row.kdf_parallelism,
      hashLength: row.kdf_hash_length,
    },
  };
}

export async function countUsers(db: Pool): Promise<number> {
  const result = await db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users");
  return Number(result.rows[0]?.count ?? 0);
}

export async function findUserByUsername(db: Pool, username: string): Promise<UserRecord | null> {
  const result = await db.query<UserRow>("SELECT * FROM users WHERE username = $1", [username]);
  const row = result.rows[0];
  return row ? mapUser(row) : null;
}

export async function insertUser(
  db: Pool,
  input: {
    username: string;
    authHash: string;
    authSalt: string;
    kdf: PublicKdfParams;
  },
): Promise<UserRecord> {
  const result = await db.query<UserRow>(
    `INSERT INTO users (
      username, auth_hash, auth_salt,
      kdf_algorithm, kdf_salt, kdf_memory_kib, kdf_iterations, kdf_parallelism, kdf_hash_length
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      input.username,
      input.authHash,
      input.authSalt,
      input.kdf.algorithm,
      input.kdf.salt,
      input.kdf.memoryKiB,
      input.kdf.iterations,
      input.kdf.parallelism,
      input.kdf.hashLength,
    ],
  );
  return mapUser(result.rows[0]!);
}

export async function recordFailedLogin(
  db: Pool,
  userId: string,
  threshold: number,
  lockMinutes: number,
): Promise<void> {
  await db.query(
    `UPDATE users
     SET failed_logins = failed_logins + 1,
         locked_until = CASE
           WHEN failed_logins + 1 >= $2 THEN NOW() + ($3 * INTERVAL '1 minute')
           ELSE locked_until
         END
     WHERE id = $1`,
    [userId, threshold, lockMinutes],
  );
}

export async function resetFailedLogins(db: Pool, userId: string): Promise<void> {
  await db.query("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = $1", [userId]);
}

export async function deleteUserByUsername(db: Pool, username: string): Promise<void> {
  await db.query("DELETE FROM users WHERE username = $1", [username]);
}
