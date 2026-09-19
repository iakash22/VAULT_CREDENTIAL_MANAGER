import { validateEncryptedPayload } from "@vault/crypto";
import { z } from "zod";
import { HttpError } from "../httpError.js";

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

export const putVaultKeyBodySchema = z.object({
  wrappedKey: encryptedPayload,
});

export type PutVaultKeyBody = z.infer<typeof putVaultKeyBodySchema>;

export function parseEncryptedPayload(data: unknown): ReturnType<typeof validateEncryptedPayload> {
  try {
    return validateEncryptedPayload(data);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : "Invalid encrypted payload");
  }
}
