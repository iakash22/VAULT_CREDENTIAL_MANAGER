import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { fetchHealth, fetchReady } from "../lib/api";
import { fetchMe } from "../lib/authApi";
import { runCryptoSelfTest, type SelfTestResult } from "../lib/cryptoSelfTest";

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
      <div className="glass-panel rounded-3xl p-6">
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Session JWT expires in about {remainingMin} minute{remainingMin === 1 ? "" : "s"}. The
          encryption key stays in RAM and is dropped when you lock.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6">
        <h2 className="text-lg font-medium">API connectivity</h2>
        <p className="mt-1 text-sm text-slate-400">Health, readiness, and the authenticated /me route.</p>
        <button
          type="button"
          onClick={() => void onProbeApi()}
          disabled={probe.loading}
          className="mt-4 rounded-2xl bg-accent-500 px-4 py-3 text-sm font-semibold text-ink-950 transition hover:bg-accent-400 disabled:opacity-60"
        >
          {probe.loading ? "Checking…" : "Ping API"}
        </button>
        {probe.health ? <p className="mt-3 text-sm text-accent-300">{probe.health}</p> : null}
        {probe.ready ? <p className="text-sm text-slate-300">{probe.ready}</p> : null}
        {probe.me ? <p className="text-sm text-slate-300">{probe.me}</p> : null}
        {probe.error ? <p className="mt-3 text-sm text-rose-300">{probe.error}</p> : null}
      </div>

      <div className="glass-panel rounded-3xl p-6">
        <h2 className="text-lg font-medium">Crypto self-test</h2>
        <p className="mt-1 text-sm text-slate-400">
          Client-only Argon2id + AES-256-GCM check. Nothing is written to the database.
        </p>
        <button
          type="button"
          onClick={() => void onSelfTest()}
          disabled={testing}
          className="mt-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-60"
        >
          {testing ? "Running…" : "Run crypto self-test"}
        </button>
        {selfTest ? (
          <p className={`mt-3 text-sm ${selfTest.ok ? "text-accent-300" : "text-rose-300"}`}>
            {selfTest.ok ? "Passed" : "Failed"} · {selfTest.elapsedMs}ms · {selfTest.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
