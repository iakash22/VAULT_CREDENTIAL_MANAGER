import type { CollectionTreeNode, SecretTreeNode, WorkspaceSummary, WorkspaceTreeResponse } from "@vault/types";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { TreeSkeleton, TreeView } from "../components/TreeView";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHeader } from "../components/ui/PageHeader";
import {
  createCollection,
  createWorkspace,
  fetchWorkspaceTree,
  fetchWorkspaces,
} from "../lib/hierarchyApi";

interface CollectionsPageProps {
  onOpenCollection: (workspaceId: string, collectionId: string, collectionName: string) => void;
  onOpenSecret: (secretId: string, title: string) => void;
}

export function CollectionsPage({ onOpenCollection, onOpenSecret }: CollectionsPageProps) {
  const { session } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [tree, setTree] = useState<WorkspaceTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [parentCollectionId, setParentCollectionId] = useState<string>("");

  const loadTree = useCallback(
    async (workspaceId: string) => {
      if (!session) {
        return;
      }
      const data = await fetchWorkspaceTree(session.token, workspaceId);
      setTree(data);
    },
    [session],
  );

  const refresh = useCallback(async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { workspaces: list } = await fetchWorkspaces(session.token);
      setWorkspaces(list);
      const nextId = activeWorkspaceId && list.some((item) => item.id === activeWorkspaceId)
        ? activeWorkspaceId
        : (list[0]?.id ?? null);
      setActiveWorkspaceId(nextId);
      if (nextId) {
        await loadTree(nextId);
      } else {
        setTree(null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load hierarchy");
    } finally {
      setLoading(false);
    }
  }, [session, activeWorkspaceId, loadTree]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreateWorkspace(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !newWorkspaceName.trim()) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const workspace = await createWorkspace(session.token, { name: newWorkspaceName.trim() });
      setNewWorkspaceName("");
      setActiveWorkspaceId(workspace.id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create workspace");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateCollection(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !activeWorkspaceId || !newCollectionName.trim()) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createCollection(session.token, activeWorkspaceId, {
        name: newCollectionName.trim(),
        parentId: parentCollectionId || null,
      });
      setNewCollectionName("");
      setParentCollectionId("");
      await loadTree(activeWorkspaceId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create collection");
    } finally {
      setBusy(false);
    }
  }

  const flatCollections = flattenCollections(tree?.tree ?? []);

  return (
    <section className="grid gap-4">
      <GlassCard delay={1}>
        <PageHeader
          title="Collections"
          description="Workspace → nested folders → encrypted secrets. Tap Open on a folder for details."
        />
      </GlassCard>

      <GlassCard delay={2}>
        <h2 className="text-sm font-medium text-slate-200">New workspace</h2>
        <form onSubmit={(event) => void onCreateWorkspace(event)} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={newWorkspaceName}
            onChange={(event) => setNewWorkspaceName(event.target.value)}
            placeholder="Personal"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-ink-950 disabled:opacity-60"
          >
            Create
          </button>
        </form>
      </GlassCard>

      {workspaces.length > 0 ? (
        <GlassCard delay={3}>
          <div className="flex flex-wrap gap-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => {
                  setActiveWorkspaceId(workspace.id);
                  void loadTree(workspace.id);
                }}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activeWorkspaceId === workspace.id
                    ? "bg-accent-500 text-ink-950"
                    : "border border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                {workspace.name}
              </button>
            ))}
          </div>

          {activeWorkspaceId ? (
            <form onSubmit={(event) => void onCreateCollection(event)} className="mt-5 grid gap-3">
              <h2 className="text-sm font-medium text-slate-200">New collection</h2>
              <input
                value={newCollectionName}
                onChange={(event) => setNewCollectionName(event.target.value)}
                placeholder="Infrastructure"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
              />
              <select
                value={parentCollectionId}
                onChange={(event) => setParentCollectionId(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
              >
                <option value="">No parent (top level)</option>
                {flatCollections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                Add collection
              </button>
            </form>
          ) : null}
        </GlassCard>
      ) : null}

      <GlassCard>
        <h2 className="text-sm font-medium text-slate-200">Tree</h2>
        <div className="mt-4">
          {loading ? (
            <TreeSkeleton />
          ) : tree && activeWorkspaceId ? (
            <TreeView
              tree={tree.tree}
              rootSecrets={tree.rootSecrets}
              onOpenCollection={(collection: CollectionTreeNode) =>
                onOpenCollection(activeWorkspaceId, collection.id, collection.name)
              }
              onOpenSecret={(secret: SecretTreeNode) => onOpenSecret(secret.id, secret.title)}
            />
          ) : (
            <p className="text-sm text-slate-400">Create a workspace to begin.</p>
          )}
        </div>
      </GlassCard>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}

function flattenCollections(
  nodes: WorkspaceTreeResponse["tree"],
  prefix = "",
): Array<{ id: string; label: string }> {
  const items: Array<{ id: string; label: string }> = [];
  for (const node of nodes) {
    const label = prefix ? `${prefix} / ${node.name}` : node.name;
    items.push({ id: node.id, label });
    items.push(...flattenCollections(node.children, label));
  }
  return items;
}
