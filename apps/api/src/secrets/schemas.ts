import { SECRET_TYPES } from "@vault/types";
import { validateEncryptedPayload } from "@vault/crypto";
import { z } from "zod";
import { parseOrThrow } from "../auth/schemas.js";

const secretType = z.enum(SECRET_TYPES);

const tag = z
  .string()
  .trim()
  .min(1, "Tags cannot be empty")
  .max(40, "Each tag must be at most 40 characters")
  .transform((value) => value.toLowerCase());

const encryptedPayload = z.custom<ReturnType<typeof validateEncryptedPayload>>(
  (value) => {
    try {
      validateEncryptedPayload(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid encrypted payload" },
);

export const createSecretBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  tags: z.array(tag).max(20, "At most 20 tags").optional().default([]),
  secretType,
  collectionId: z.string().uuid("collectionId must be a UUID").optional().nullable(),
  encryptedPayload,
});

export const secretIdParamsSchema = z.object({
  secretId: z.string().uuid("secretId must be a UUID"),
});

export const searchSecretsQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  type: secretType.optional(),
  tag: tag.optional(),
});

export type CreateSecretBody = z.infer<typeof createSecretBodySchema>;
export type SecretIdParams = z.infer<typeof secretIdParamsSchema>;
export type SearchSecretsQuery = z.infer<typeof searchSecretsQuerySchema>;

export function parseSecretParams(data: unknown): SecretIdParams {
  return parseOrThrow(secretIdParamsSchema, data);
}

export function parseSearchQuery(data: unknown): SearchSecretsQuery {
  const parsed = searchSecretsQuerySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid search query");
  }
  return parsed.data;
}
