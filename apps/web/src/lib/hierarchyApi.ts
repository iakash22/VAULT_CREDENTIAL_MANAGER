import {
  API_PATHS,
  type CollectionSummary,
  type CreateCollectionRequest,
  type CreateWorkspaceRequest,
  type WorkspaceSummary,
  type WorkspaceTreeResponse,
  type WorkspacesResponse,
} from "@vault/types";
import { request } from "./api";

export function fetchWorkspaces(token: string): Promise<WorkspacesResponse> {
  return request<WorkspacesResponse>(API_PATHS.workspaces, { token });
}

export function createWorkspace(token: string, body: CreateWorkspaceRequest): Promise<WorkspaceSummary> {
  return request<WorkspaceSummary>(API_PATHS.workspaces, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function createCollection(
  token: string,
  workspaceId: string,
  body: CreateCollectionRequest,
): Promise<CollectionSummary> {
  return request<CollectionSummary>(API_PATHS.workspaceCollections(workspaceId), {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchWorkspaceTree(token: string, workspaceId: string): Promise<WorkspaceTreeResponse> {
  return request<WorkspaceTreeResponse>(API_PATHS.workspaceTree(workspaceId), { token });
}
