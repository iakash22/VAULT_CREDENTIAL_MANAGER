import { SECRET_TYPES, SECRET_TYPE_LABELS, type SecretSummary, type SecretType } from "@vault/types";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { SecretTypeBadge } from "../components/SecretTypeBadge";
import { BackBar } from "../components/ui/BackBar";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHeader } from "../components/ui/PageHeader";
import { fetchWorkspaces } from "../lib/hierarchyApi";
import { searchSecrets } from "../lib/secretsApi";

interface SearchPageProps {
  onBack: () => void;
  onOpenSecret: (secretId: string, title: string) => void;
}

export function SearchPage({ onBack, onOpenSecret }: SearchPageProps) {
  const { session } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SecretType | "">("");
  const [results, setResults] = useState<SecretSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }
    void fetchWorkspaces(session.token).then(({ workspaces }) => {
      setWorkspaceId(workspaces[0]?.id ?? null);
    });
  }, [session]);

  const runSearch = useCallback(async () => {
    if (!session || !workspaceId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await searchSecrets(session.token, workspaceId, {
        q: query.trim() || undefined,
        type: typeFilter || undefined,
      });
      setResults(response.secrets);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [session, workspaceId, query, typeFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runSearch();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [runSearch]);

  return (
    <section className="page-enter grid gap-4">
      <BackBar label="Home" onBack={onBack} />

      <GlassCard>
        <PageHeader
          title="Search"
          description="Fast lookup by title or tags. Sensitive fields stay encrypted."
        />
      </GlassCard>

      <GlassCard>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="github, prod, ssh…"
          className="input-field"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip active={typeFilter === ""} onClick={() => setTypeFilter("")} label="All" />
          {SECRET_TYPES.map((type) => (
            <FilterChip
              key={type}
              active={typeFilter === type}
              onClick={() => setTypeFilter(type)}
              label={SECRET_TYPE_LABELS[type]}
            />
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {loading ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}`}
        </p>
        <ul className="mt-4 grid gap-2">
          {results.map((secret) => (
            <li key={secret.id}>
              <button
                type="button"
                onClick={() => onOpenSecret(secret.id, secret.title)}
                className="glass-panel-interactive flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">{secret.title}</span>
                    <SecretTypeBadge type={secret.secretType} />
                  </div>
                  {secret.tags.length > 0 ? (
                    <p className="mt-1 text-xs text-slate-500">{secret.tags.join(" · ")}</p>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
        {!loading && results.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No matches. Try another title, tag, or type.</p>
        ) : null}
      </GlassCard>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-accent-500 text-ink-950" : "border border-white/10 bg-white/5 text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}
