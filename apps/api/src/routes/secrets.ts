import type { FastifyInstance } from "fastify";
import { parseOrThrow } from "../auth/schemas.js";
import { findCollectionForUser } from "../hierarchy/collections.js";
import { parseWorkspaceParams } from "../hierarchy/schemas.js";
import { findWorkspaceForUser } from "../hierarchy/workspaces.js";
import { HttpError, requireDb } from "../httpError.js";
import {
  createSecret,
  deleteSecretForUser,
  findSecretForUser,
  listSecretsInWorkspace,
  searchSecretsInWorkspace,
  toSummary,
} from "../secrets/secrets.js";
import {
  createSecretBodySchema,
  parseSearchQuery,
  parseSecretParams,
} from "../secrets/schemas.js";

export async function secretsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/workspaces/:workspaceId/secrets/search", async (request) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const params = parseWorkspaceParams(request.params);
    let query;
    try {
      query = parseSearchQuery(request.query);
    } catch (error) {
      throw new HttpError(400, error instanceof Error ? error.message : "Invalid search query");
    }

    const workspace = await findWorkspaceForUser(db, params.workspaceId, request.user.id);
    if (!workspace) {
      throw new HttpError(404, "Workspace not found");
    }

    const secrets = await searchSecretsInWorkspace(db, params.workspaceId, request.user.id, query);
    return { secrets, query };
  });

  app.get("/workspaces/:workspaceId/secrets", async (request) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const params = parseWorkspaceParams(request.params);
    const workspace = await findWorkspaceForUser(db, params.workspaceId, request.user.id);
    if (!workspace) {
      throw new HttpError(404, "Workspace not found");
    }
    const secrets = await listSecretsInWorkspace(db, params.workspaceId, request.user.id);
    return { secrets };
  });

  app.post("/workspaces/:workspaceId/secrets", async (request, reply) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const params = parseWorkspaceParams(request.params);
    const body = parseOrThrow(createSecretBodySchema, request.body);

    const workspace = await findWorkspaceForUser(db, params.workspaceId, request.user.id);
    if (!workspace) {
      throw new HttpError(404, "Workspace not found");
    }

    if (body.collectionId) {
      const collection = await findCollectionForUser(
        db,
        body.collectionId,
        request.user.id,
        params.workspaceId,
      );
      if (!collection) {
        throw new HttpError(404, "Collection not found in this workspace");
      }
    }

    const secret = await createSecret(db, {
      workspaceId: params.workspaceId,
      userId: request.user.id,
      collectionId: body.collectionId ?? null,
      secretType: body.secretType,
      title: body.title,
      tags: body.tags ?? [],
      encryptedPayload: body.encryptedPayload,
    });

    reply.status(201);
    return toSummary(secret);
  });

  app.get("/secrets/:secretId", async (request) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const params = parseSecretParams(request.params);
    const secret = await findSecretForUser(db, params.secretId, request.user.id);
    if (!secret) {
      throw new HttpError(404, "Secret not found");
    }
    return secret;
  });

  app.delete("/secrets/:secretId", async (request, reply) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const params = parseSecretParams(request.params);
    const deleted = await deleteSecretForUser(db, params.secretId, request.user.id);
    if (!deleted) {
      throw new HttpError(404, "Secret not found");
    }
    reply.status(204);
    return null;
  });
}
