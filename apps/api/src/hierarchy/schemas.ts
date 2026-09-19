import { z } from "zod";
import { parseOrThrow } from "../auth/schemas.js";

const entityName = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Name must be at most 120 characters");

export const createWorkspaceBodySchema = z.object({
  name: entityName,
});

export const workspaceIdParamsSchema = z.object({
  workspaceId: z.string().uuid("workspaceId must be a UUID"),
});

export const createCollectionBodySchema = z.object({
  name: entityName,
  parentId: z.string().uuid("parentId must be a UUID").optional().nullable(),
});

export type CreateWorkspaceBody = z.infer<typeof createWorkspaceBodySchema>;
export type WorkspaceIdParams = z.infer<typeof workspaceIdParamsSchema>;
export type CreateCollectionBody = z.infer<typeof createCollectionBodySchema>;

export function parseWorkspaceParams(data: unknown): WorkspaceIdParams {
  return parseOrThrow(workspaceIdParamsSchema, data);
}
