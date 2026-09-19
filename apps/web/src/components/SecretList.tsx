import type { SecretSummary } from "@vault/types";
import { SecretTypeBadge } from "./SecretTypeBadge";

interface SecretListProps {
  secrets: SecretSummary[];
  onOpen: (secret: SecretSummary) => void;
}

export function SecretList({ secrets, onOpen }: SecretListProps) {
  if (secrets.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
        No secrets yet. Add one to store encrypted credentials.
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {secrets.map((secret) => (
        <li key={secret.id}>
          <button
            type="button"
            onClick={() => onOpen(secret)}
            className="glass-panel-interactive flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium">{secret.title}</span>
                <SecretTypeBadge type={secret.secretType} />
              </div>
              {secret.tags.length > 0 ? (
                <p className="mt-1 truncate text-xs text-slate-500">{secret.tags.join(" · ")}</p>
              ) : null}
            </div>
            <span className="text-xs text-slate-500">{formatWhen(secret.updatedAt)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
