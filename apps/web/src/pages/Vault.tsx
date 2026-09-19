import type { SecretSummary, WorkspaceTreeResponse } from "@vault/types";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { AddSecretModal, type AddSecretFormValues } from "../components/AddSecretModal";
import { SecretList } from "../components/SecretList";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHeader } from "../components/ui/PageHeader";
import { fetchWorkspaceTree, fetchWorkspaces } from "../lib/hierarchyApi";
import { createSecret, listSecrets } from "../lib/secretsApi";
import { encryptSecretPayload } from "../lib/vaultCrypto";

interface VaultPageProps {
  onOpenSecret: (secretId: string, title: string) => void;
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

export function VaultPage({ onOpenSecret }: VaultPageProps) {
  const { session } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<SecretSummary[]>([]);
  const [collectionOptions, setCollectionOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.vaultKey) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { workspaces } = await fetchWorkspaces(session.token);
      const activeId = workspaceId && workspaces.some((item) => item.id === workspaceId)
        ? workspaceId
        : (workspaces[0]?.id ?? null);
      setWorkspaceId(activeId);
      if (!activeId) {
        setSecrets([]);
        setCollectionOptions([]);
        return;
      }
      const [{ secrets: list }, tree] = await Promise.all([
        listSecrets(session.token, activeId),
        fetchWorkspaceTree(session.token, activeId),
      ]);
      setSecrets(list);
      setCollectionOptions(flattenCollections(tree.tree));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load vault");
    } finally {
      setLoading(false);
    }
  }, [session, workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onAddSecret(values: AddSecretFormValues) {
    if (!session?.vaultKey || !workspaceId) {
      throw new Error("Vault is not unlocked");
    }
    setBusy(true);
    try {
      const encryptedPayload = await encryptSecretPayload(session.vaultKey, values.payload);
      await createSecret(session.token, workspaceId, {
        title: values.title,
        tags: values.tags,
        secretType: values.secretType,
        collectionId: values.collectionId,
        encryptedPayload,
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const vaultReady = Boolean(session?.vaultKey);

  return (
    <section className="grid gap-4">
      <GlassCard delay={1}>
        <PageHeader
          eyebrow="Encrypted storage"
          title="Vault"
          description="Secrets are encrypted in your browser before upload."
          action={
            vaultReady ? (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                disabled={!workspaceId || busy}
                className="btn-primary"
              >
                Add secret
              </button>
            ) : undefined
          }
        />
        {!vaultReady ? <p className="mt-4 text-sm text-rose-300">Unlock the vault to manage secrets.</p> : null}
      </GlassCard>

      <GlassCard delay={2}>
        <h2 className="text-sm font-medium text-slate-200">All secrets</h2>
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <SecretList secrets={secrets} onOpen={(secret) => onOpenSecret(secret.id, secret.title)} />
          )}
        </div>
      </GlassCard>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <AddSecretModal
        open={modalOpen}
        collectionOptions={collectionOptions}
        busy={busy}
        onClose={() => setModalOpen(false)}
        onSubmit={onAddSecret}
      />
    </section>
  );
}
