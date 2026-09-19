import type { CollectionTreeNode, SecretTreeNode } from "@vault/types";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { SecretTypeBadge } from "../components/SecretTypeBadge";
import { BackBar } from "../components/ui/BackBar";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHeader } from "../components/ui/PageHeader";
import { fetchWorkspaceTree } from "../lib/hierarchyApi";
import type { AppRoute } from "../navigation/types";

interface CollectionDetailPageProps {
  workspaceId: string;
  collectionId: string;
  collectionName: string;
  onNavigate: (route: AppRoute) => void;
  onBack: () => void;
}

export function CollectionDetailPage({
  workspaceId,
  collectionId,
  collectionName,
  onNavigate,
  onBack,
}: CollectionDetailPageProps) {
  const { session } = useAuth();
  const [collection, setCollection] = useState<CollectionTreeNode | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    try {
      const tree = await fetchWorkspaceTree(session.token, workspaceId);
      setCollection(findCollection(tree.tree, collectionId));
    } finally {
      setLoading(false);
    }
  }, [session, workspaceId, collectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="page-enter grid gap-4">
      <BackBar label="Collections" onBack={onBack} />

      <GlassCard>
        <PageHeader
          eyebrow="Collection"
          title={collectionName}
          description={
            collection
              ? `${collection.secrets.length} secret(s) · ${collection.children.length} subfolder(s)`
              : undefined
          }
        />
      </GlassCard>

      {loading ? (
        <GlassCard>
          <p className="text-sm text-slate-400">Loading…</p>
        </GlassCard>
      ) : collection ? (
        <>
          {collection.children.length > 0 ? (
            <GlassCard>
              <h2 className="text-sm font-medium text-slate-200">Subcollections</h2>
              <ul className="mt-3 grid gap-2">
                {collection.children.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate({
                          screen: "collection",
                          workspaceId,
                          collectionId: child.id,
                          collectionName: child.name,
                        })
                      }
                      className="glass-panel-interactive flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm"
                    >
                      <span>{child.name}</span>
                      <span className="text-xs text-slate-500">{child.secrets.length} secrets</span>
                    </button>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ) : null}

          <GlassCard>
            <h2 className="text-sm font-medium text-slate-200">Secrets</h2>
            {collection.secrets.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No secrets in this collection yet.</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {collection.secrets.map((secret) => (
                  <SecretRow
                    key={secret.id}
                    secret={secret}
                    onOpen={() =>
                      onNavigate({ screen: "secret", secretId: secret.id, title: secret.title })
                    }
                  />
                ))}
              </ul>
            )}
          </GlassCard>
        </>
      ) : (
        <GlassCard>
          <p className="text-sm text-rose-300">Collection not found.</p>
        </GlassCard>
      )}
    </section>
  );
}

function SecretRow({ secret, onOpen }: { secret: SecretTreeNode; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="glass-panel-interactive flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{secret.title}</span>
        <SecretTypeBadge type={secret.secretType} />
      </button>
    </li>
  );
}

function findCollection(nodes: CollectionTreeNode[], id: string): CollectionTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const nested = findCollection(node.children, id);
    if (nested) {
      return nested;
    }
  }
  return null;
}
