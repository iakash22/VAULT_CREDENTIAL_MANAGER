import { USERNAME_MAX, USERNAME_MIN, USERNAME_PATTERN } from "@vault/types";
import { z } from "zod";
import { HttpError } from "../httpError.js";

const username = z
  .string()
  .trim()
  .min(USERNAME_MIN)
  .max(USERNAME_MAX)
  .regex(USERNAME_PATTERN, "Username can only contain letters, numbers, dots, underscores, and hyphens")
  .transform((value) => value.toLowerCase());

const authVerifier = z
  .string()
  .min(16)
  .max(128)
  .refine((value) => {
    try {
      return Buffer.from(value, "base64").byteLength === 32;
    } catch {
      return false;
    }
  }, "authVerifier must be 32 bytes, base64-encoded");

const kdf = z.object({
  algorithm: z.literal("argon2id"),
  salt: z.string().min(8).max(128),
  memoryKiB: z.number().int().min(8).max(1_048_576),
  iterations: z.number().int().min(1).max(10),
  parallelism: z.number().int().min(1).max(16),
  hashLength: z.literal(32),
});

export const registerBodySchema = z.object({
  username,
  authVerifier,
  kdf,
});

export const loginBodySchema = z.object({
  username,
  authVerifier,
});

export const kdfQuerySchema = z.object({
  username,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  if (data && typeof data === "object" && ("password" in data || "masterPassword" in data)) {
    throw new HttpError(400, "Master password must not be sent to the server");
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid request");
  }
  return parsed.data;
}
