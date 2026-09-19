import type { SecretPayload, SecretSummary } from "@vault/types";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { SecretTypeBadge } from "../components/SecretTypeBadge";
import { BackBar } from "../components/ui/BackBar";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHeader } from "../components/ui/PageHeader";
import { copyWithAutoClear } from "../lib/clipboard";
import { CLIPBOARD_CLEAR_MS } from "../lib/securityConfig";
import { deleteSecret, getSecret } from "../lib/secretsApi";
import { decryptSecretPayload } from "../lib/vaultCrypto";
interface SecretDetailPageProps {
  secretId: string;
  fallbackTitle?: string;
  onBack: () => void;
  onDeleted: () => void;
}

export function SecretDetailPage({ secretId, fallbackTitle, onBack, onDeleted }: SecretDetailPageProps) {
  const { session } = useAuth();
  const [meta, setMeta] = useState<SecretSummary | null>(null);
  const [payload, setPayload] = useState<SecretPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.vaultKey) {
      setError("Vault is locked");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const detail = await getSecret(session.token, secretId);
      setMeta(detail);
      setPayload(await decryptSecretPayload(session.vaultKey, detail.encryptedPayload));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load secret");
    } finally {
      setLoading(false);
    }
  }, [session, secretId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCopy(label: string, value: string) {
    await copyWithAutoClear(value, CLIPBOARD_CLEAR_MS);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 2000);
  }

  async function onDelete() {
    if (!session || !meta || !window.confirm(`Delete "${meta.title}"?`)) {
      return;
    }
    await deleteSecret(session.token, secretId);
    onDeleted();
    onBack();
  }

  const title = meta?.title ?? fallbackTitle ?? "Secret";

  return (
    <section className="page-enter grid gap-4">
      <BackBar label="Back" onBack={onBack} />

      <GlassCard>
        <div className="flex flex-wrap items-center gap-2">
          <PageHeader title={title} description="Decrypted locally. Clipboard clears automatically." />
          {meta ? <SecretTypeBadge type={meta.secretType} /> : null}
        </div>
        {meta && meta.tags.length > 0 ? (
          <p className="mt-3 text-xs text-slate-500">{meta.tags.join(" · ")}</p>
        ) : null}
      </GlassCard>

      {loading ? (
        <GlassCard>
          <p className="text-sm text-slate-400">Decrypting…</p>
        </GlassCard>
      ) : error ? (
        <GlassCard>
          <p className="text-sm text-rose-300">{error}</p>
        </GlassCard>
      ) : payload ? (
        <GlassCard>
          <FieldList payload={payload} copied={copied} onCopy={(label, value) => void onCopy(label, value)} />
          <button type="button" onClick={() => void onDelete()} className="mt-6 text-sm text-rose-300 hover:text-rose-200">
            Delete secret
          </button>
        </GlassCard>
      ) : null}

      {copied ? (
        <p className="text-center text-xs text-accent-300">
          Copied — clipboard clears in {Math.round(CLIPBOARD_CLEAR_MS / 1000)}s
        </p>
      ) : null}
    </section>
  );
}

function FieldList({
  payload,
  copied,
  onCopy,
}: {
  payload: SecretPayload;
  copied: string | null;
  onCopy: (label: string, value: string) => void;
}) {
  const fields: Array<{ label: string; value?: string }> = [];

  switch (payload.type) {
    case "password":
      fields.push(
        { label: "Username", value: payload.username },
        { label: "Password", value: payload.password },
        { label: "URI", value: payload.uri },
        { label: "Notes", value: payload.notes },
      );
      break;
    case "ssh":
      fields.push(
        { label: "Host", value: payload.host },
        { label: "Private key", value: payload.privateKey },
        { label: "Notes", value: payload.notes },
      );
      break;
    case "token":
      fields.push(
        { label: "Token", value: payload.token },
        { label: "Issuer", value: payload.issuer },
        { label: "Notes", value: payload.notes },
      );
      break;
    case "env":
      for (const entry of payload.entries ?? []) {
        fields.push({ label: entry.key, value: entry.value });
      }
      if (payload.notes) {
        fields.push({ label: "Notes", value: payload.notes });
      }
      break;
  }

  return (
    <dl className="grid gap-4">
      {fields
        .filter((field) => field.value)
        .map((field) => (
          <div key={field.label}>
            <dt className="text-xs uppercase tracking-wider text-slate-500">{field.label}</dt>
            <dd className="mt-1 flex items-start justify-between gap-3">
              <span className="break-all font-mono text-sm text-slate-200">{field.value}</span>
              <button
                type="button"
                onClick={() => onCopy(field.label, field.value!)}
                className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5"
              >
                {copied === field.label ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>
        ))}
    </dl>
  );
}
