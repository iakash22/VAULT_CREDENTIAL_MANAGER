import type { FastifyInstance } from "fastify";
import { HttpError, requireDb } from "../httpError.js";
import { findVaultKeyByUserId, insertVaultKey } from "../vault/keys.js";
import { parseOrThrow } from "../auth/schemas.js";
import { putVaultKeyBodySchema } from "../vault/schemas.js";

export async function vaultRoutes(app: FastifyInstance): Promise<void> {
  app.get("/key", { preHandler: app.authenticate }, async (request) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const wrappedKey = await findVaultKeyByUserId(db, request.user.id);
    if (!wrappedKey) {
      throw new HttpError(404, "Vault key not found");
    }
    return { wrappedKey };
  });

  app.put("/key", { preHandler: app.authenticate }, async (request, reply) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const body = parseOrThrow(putVaultKeyBodySchema, request.body);

    const existing = await findVaultKeyByUserId(db, request.user.id);
    if (existing) {
      throw new HttpError(409, "Vault key already exists");
    }

    await insertVaultKey(db, request.user.id, body.wrappedKey);
    reply.status(201);
    return { wrappedKey: body.wrappedKey };
  });
}
