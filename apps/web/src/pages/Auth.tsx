import { deriveMasterKeySet, encodeAuthVerifier } from "@vault/crypto";
import { validateMasterPassword, validateUsername } from "@vault/types";
import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/useAuth";
import { PasswordField } from "../components/PasswordField";
import { fetchKdfParams, loginAccount, registerAccount } from "../lib/authApi";

type Mode = "login" | "register";

export function AuthPage() {
  const { setSession } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    const passwordError = validateMasterPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (mode === "register" && password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      if (mode === "register") {
        const keys = await deriveMasterKeySet(password);
        const session = await registerAccount(username, encodeAuthVerifier(keys.authVerifier), keys.kdf);
        setSession({
          token: session.token,
          expiresAt: Date.now() + session.expiresIn * 1000,
          user: session.user,
          encryptionKey: keys.encryptionKey,
        });
        return;
      }

      const { kdf } = await fetchKdfParams(username);
      const keys = await deriveMasterKeySet(password, kdf);
      const session = await loginAccount(username, encodeAuthVerifier(keys.authVerifier));
      setSession({
        token: session.token,
        expiresAt: Date.now() + session.expiresIn * 1000,
        user: session.user,
        encryptionKey: keys.encryptionKey,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="pointer-events-none absolute -left-16 top-16 h-64 w-64 animate-pulseGlow rounded-full bg-accent-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 animate-pulseGlow rounded-full bg-indigo-500/20 blur-3xl" />

      <form onSubmit={(event) => void onSubmit(event)} className="glass-panel w-full max-w-md rounded-3xl p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-300">Vault</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          {mode === "login" ? "Unlock" : "Create vault"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Your master password never leaves this device. The server only stores a verifier hash and
          salt — not the encryption key.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="block" htmlFor="username">
            <span className="mb-2 block text-sm text-slate-300">Username</span>
            <input
              id="username"
              value={username}
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
            />
          </label>

          <PasswordField
            id="password"
            label="Master password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {mode === "register" ? (
            <PasswordField
              id="confirm"
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              hint="Must match exactly"
            />
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-2xl bg-accent-500 py-3 text-sm font-semibold text-ink-950 transition hover:bg-accent-400 disabled:opacity-60"
        >
          {busy ? "Deriving key…" : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="mt-4 w-full text-sm text-slate-400 hover:text-white"
        >
          {mode === "login" ? "Need an account? Create the first vault" : "Already registered? Sign in"}
        </button>
      </form>
    </div>
  );
}
