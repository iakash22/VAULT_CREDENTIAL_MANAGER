import { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { listCollectionsInWorkspace, createCollection, findCollectionForUser, listSecretMetaInWorkspace } from "../hierarchy/collections.js";
import {
  createCollectionBodySchema,
  createWorkspaceBodySchema,
  parseWorkspaceParams,
} from "../hierarchy/schemas.js";
import { buildWorkspaceTree } from "../hierarchy/tree.js";
import {
  createWorkspace,
  findWorkspaceForUser,
  listWorkspacesForUser,
} from "../hierarchy/workspaces.js";
import { parseOrThrow } from "../auth/schemas.js";
import { HttpError, requireDb } from "../httpError.js";

export async function hierarchyRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/workspaces", async (request) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const workspaces = await listWorkspacesForUser(db, request.user.id);
    return {
      workspaces: workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
      })),
    };
  });

  app.post("/workspaces", async (request, reply) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const body = parseOrThrow(createWorkspaceBodySchema, request.body);
    try {
      const workspace = await createWorkspace(db, request.user.id, body.name);
      reply.status(201);
      return {
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(409, "A workspace with this name already exists");
      }
      throw error;
    }
  });

  app.post("/workspaces/:workspaceId/collections", async (request, reply) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const params = parseWorkspaceParams(request.params);
    const body = parseOrThrow(createCollectionBodySchema, request.body);

    const workspace = await findWorkspaceForUser(db, params.workspaceId, request.user.id);
    if (!workspace) {
      throw new HttpError(404, "Workspace not found");
    }

    if (body.parentId) {
      const parent = await findCollectionForUser(db, body.parentId, request.user.id, params.workspaceId);
      if (!parent) {
        throw new HttpError(404, "Parent collection not found in this workspace");
      }
    }

    const collection = await createCollection(db, {
      workspaceId: params.workspaceId,
      userId: request.user.id,
      name: body.name,
      parentId: body.parentId ?? null,
    });

    reply.status(201);
    return {
      id: collection.id,
      workspaceId: collection.workspaceId,
      parentId: collection.parentId,
      name: collection.name,
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
    };
  });

  app.get("/workspaces/:workspaceId/tree", async (request) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const db = requireDb(app.db);
    const params = parseWorkspaceParams(request.params);

    const workspace = await findWorkspaceForUser(db, params.workspaceId, request.user.id);
    if (!workspace) {
      throw new HttpError(404, "Workspace not found");
    }

    const [collections, secrets] = await Promise.all([
      listCollectionsInWorkspace(db, params.workspaceId, request.user.id),
      listSecretMetaInWorkspace(db, params.workspaceId, request.user.id),
    ]);

    return buildWorkspaceTree(workspace, collections, secrets);
  });
}
