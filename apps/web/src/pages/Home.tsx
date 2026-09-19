import type { SecretSummary, WorkspaceSummary } from "@vault/types";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHeader } from "../components/ui/PageHeader";
import { fetchWorkspaces } from "../lib/hierarchyApi";
import { listSecrets } from "../lib/secretsApi";
import type { AppRoute } from "../navigation/types";

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { session } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [recentSecrets, setRecentSecrets] = useState<SecretSummary[]>([]);

  useEffect(() => {
    if (!session) {
      return;
    }
    void (async () => {
      const { workspaces: list } = await fetchWorkspaces(session.token);
      setWorkspaces(list);
      if (list[0]) {
        const { secrets } = await listSecrets(session.token, list[0].id);
        setRecentSecrets(secrets.slice(0, 5));
      }
    })();
  }, [session]);

  return (
    <section className="grid gap-4">
      <GlassCard delay={1}>
        <PageHeader
          eyebrow="Welcome back"
          title={`Hi, ${session?.user.username}`}
          description="Your zero-knowledge vault. Secrets never leave this device unencrypted."
        />
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Workspaces" value={String(workspaces.length)} delay={2} />
        <StatCard label="Recent secrets" value={String(recentSecrets.length)} delay={2} />
        <StatCard
          label="Session"
          value={session ? `${Math.max(1, Math.round((session.expiresAt - Date.now()) / 60000))}m` : "—"}
          delay={2}
        />
      </div>

      <GlassCard delay={3}>
        <h2 className="text-sm font-medium text-slate-200">Quick actions</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => onNavigate({ screen: "tab", tab: "vault" })} className="btn-primary">
            Open vault
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ screen: "tab", tab: "collections" })}
            className="btn-ghost"
          >
            Collections
          </button>
          <button type="button" onClick={() => onNavigate({ screen: "search" })} className="btn-ghost">
            Search
          </button>
        </div>
      </GlassCard>

      {recentSecrets.length > 0 ? (
        <GlassCard>
          <h2 className="text-sm font-medium text-slate-200">Recent secrets</h2>
          <ul className="mt-3 grid gap-2">
            {recentSecrets.map((secret) => (
              <li key={secret.id}>
                <button
                  type="button"
                  onClick={() => onNavigate({ screen: "secret", secretId: secret.id, title: secret.title })}
                  className="glass-panel-interactive flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm"
                >
                  <span className="truncate font-medium">{secret.title}</span>
                  <span className="text-xs text-slate-500">{secret.secretType}</span>
                </button>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
    </section>
  );
}

function StatCard({ label, value, delay }: { label: string; value: string; delay?: number }) {
  return (
    <GlassCard delay={delay} className="!p-4 text-center">
      <p className="text-2xl font-semibold text-accent-300">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{label}</p>
    </GlassCard>
  );
}
