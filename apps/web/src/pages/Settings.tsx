import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHeader } from "../components/ui/PageHeader";
import { fetchHealth, fetchReady } from "../lib/api";
import { fetchMe } from "../lib/authApi";
import { runCryptoSelfTest, type SelfTestResult } from "../lib/cryptoSelfTest";
import { CLIPBOARD_CLEAR_MS, IDLE_LOCK_MINUTES, JWT_REFRESH_BEFORE_SEC } from "../lib/securityConfig";

interface ProbeState {
  loading: boolean;
  error: string | null;
  health?: string;
  ready?: string;
  me?: string;
}

export function SettingsPage() {
  const { session } = useAuth();
  const [probe, setProbe] = useState<ProbeState>({ loading: false, error: null });
  const [selfTest, setSelfTest] = useState<SelfTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const remainingMin = session ? Math.max(1, Math.round((session.expiresAt - Date.now()) / 60000)) : 0;

  async function onProbeApi() {
    setProbe({ loading: true, error: null });
    try {
      const [health, ready, me] = await Promise.all([
        fetchHealth(),
        fetchReady(),
        session ? fetchMe(session.token) : Promise.resolve(null),
      ]);
      setProbe({
        loading: false,
        error: null,
        health: `${health.status} · phase ${health.phase} · ${health.version}`,
        ready: `${ready.status} · database ${ready.checks.database}`,
        me: me ? `signed in as ${me.username}` : undefined,
      });
    } catch (error) {
      setProbe({
        loading: false,
        error: error instanceof Error ? error.message : "API probe failed",
      });
    }
  }

  async function onSelfTest() {
    setTesting(true);
    setSelfTest(null);
    const result = await runCryptoSelfTest();
    setSelfTest(result);
    setTesting(false);
  }

  return (
    <section className="grid gap-4">
      <GlassCard>
        <PageHeader
          title="Settings"
          description={`JWT refreshes ~${JWT_REFRESH_BEFORE_SEC}s before expiry. Idle lock after ${IDLE_LOCK_MINUTES} min. ~${remainingMin} min left on current token.`}
        />
      </GlassCard>

      <GlassCard>
        <h2 className="text-lg font-medium">Security</h2>
        <ul className="mt-3 grid gap-2 text-sm text-slate-300">
          <li>Rate limiting + login lockout on API</li>
          <li>Auto-lock on idle and JWT expiry</li>
          <li>Silent JWT refresh (no re-entering master password)</li>
          <li>Clipboard clears {Math.round(CLIPBOARD_CLEAR_MS / 1000)}s after copy</li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">See docs/SECURITY-HARDENING.md for attack vectors.</p>
      </GlassCard>

      <GlassCard>
        <h2 className="text-lg font-medium">API connectivity</h2>
        <button type="button" onClick={() => void onProbeApi()} disabled={probe.loading} className="btn-primary mt-4">
          {probe.loading ? "Checking…" : "Ping API"}
        </button>
        {probe.health ? <p className="mt-3 text-sm text-accent-300">{probe.health}</p> : null}
        {probe.ready ? <p className="text-sm text-slate-300">{probe.ready}</p> : null}
        {probe.me ? <p className="text-sm text-slate-300">{probe.me}</p> : null}
        {probe.error ? <p className="mt-3 text-sm text-rose-300">{probe.error}</p> : null}
      </GlassCard>

      <GlassCard>
        <h2 className="text-lg font-medium">Crypto self-test</h2>
        <button type="button" onClick={() => void onSelfTest()} disabled={testing} className="btn-ghost mt-4">
          {testing ? "Running…" : "Run crypto self-test"}
        </button>
        {selfTest ? (
          <p className={`mt-3 text-sm ${selfTest.ok ? "text-accent-300" : "text-rose-300"}`}>
            {selfTest.ok ? "Passed" : "Failed"} · {selfTest.elapsedMs}ms · {selfTest.message}
          </p>
        ) : null}
      </GlassCard>
    </section>
  );
}
