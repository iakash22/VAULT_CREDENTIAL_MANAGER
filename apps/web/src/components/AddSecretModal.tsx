import {
  SECRET_TYPES,
  SECRET_TYPE_LABELS,
  type SecretPayload,
  type SecretType,
} from "@vault/types";
import { useState, type FormEvent } from "react";
import { PasswordField } from "./PasswordField";

export interface AddSecretFormValues {
  title: string;
  tags: string[];
  secretType: SecretType;
  collectionId: string | null;
  payload: SecretPayload;
}

interface AddSecretModalProps {
  open: boolean;
  collectionOptions: Array<{ id: string; label: string }>;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: AddSecretFormValues) => Promise<void>;
}

export function AddSecretModal({ open, collectionOptions, busy, onClose, onSubmit }: AddSecretModalProps) {
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [secretType, setSecretType] = useState<SecretType>("password");
  const [collectionId, setCollectionId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [uri, setUri] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [host, setHost] = useState("");
  const [token, setToken] = useState("");
  const [issuer, setIssuer] = useState("");
  const [envText, setEnvText] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  function buildPayload(): SecretPayload {
    switch (secretType) {
      case "password":
        return { type: "password", username, password, uri, notes };
      case "ssh":
        return { type: "ssh", privateKey, host, notes };
      case "token":
        return { type: "token", token, issuer, notes };
      case "env":
        return {
          type: "env",
          entries: envText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const idx = line.indexOf("=");
              if (idx === -1) {
                return { key: line, value: "" };
              }
              return { key: line.slice(0, idx), value: line.slice(idx + 1) };
            }),
          notes,
        };
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    try {
      await onSubmit({
        title: title.trim(),
        tags: tagsInput
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
        secretType,
        collectionId: collectionId || null,
        payload: buildPayload(),
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save secret");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="glass-panel max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Add secret</h2>
            <p className="mt-1 text-sm text-slate-400">Sensitive fields are encrypted in your browser.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white">
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Title (searchable)</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
              placeholder="GitHub production"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Tags (searchable, comma-separated)</span>
            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
              placeholder="prod, github"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Type</span>
            <select
              value={secretType}
              onChange={(event) => setSecretType(event.target.value as SecretType)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
            >
              {SECRET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SECRET_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          {collectionOptions.length > 0 ? (
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Collection</span>
              <select
                value={collectionId}
                onChange={(event) => setCollectionId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
              >
                <option value="">No collection</option>
                {collectionOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {secretType === "password" ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                />
              </label>
              <PasswordField
                id="secret-password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
              />
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">URI</span>
                <input
                  value={uri}
                  onChange={(event) => setUri(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                  placeholder="https://github.com"
                />
              </label>
            </>
          ) : null}

          {secretType === "ssh" ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Host</span>
                <input
                  value={host}
                  onChange={(event) => setHost(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Private key</span>
                <textarea
                  value={privateKey}
                  onChange={(event) => setPrivateKey(event.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs outline-none"
                />
              </label>
            </>
          ) : null}

          {secretType === "token" ? (
            <>
              <PasswordField
                id="secret-token"
                label="Token"
                value={token}
                onChange={setToken}
                autoComplete="off"
              />
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Issuer</span>
                <input
                  value={issuer}
                  onChange={(event) => setIssuer(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                />
              </label>
            </>
          ) : null}

          {secretType === "env" ? (
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">KEY=value lines</span>
              <textarea
                value={envText}
                onChange={(event) => setEnvText(event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs outline-none"
                placeholder={"API_KEY=...\nDB_URL=..."}
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Notes (encrypted)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-2xl bg-accent-500 py-3 text-sm font-semibold text-ink-950 disabled:opacity-60"
        >
          {busy ? "Encrypting…" : "Save encrypted secret"}
        </button>
      </form>
    </div>
  );
}
