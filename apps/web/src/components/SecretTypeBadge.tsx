import { SECRET_TYPE_LABELS, type SecretType } from "@vault/types";

const styles: Record<SecretType, string> = {
  password: "bg-sky-400/15 text-sky-200",
  ssh: "bg-emerald-400/15 text-emerald-200",
  token: "bg-amber-400/15 text-amber-200",
  env: "bg-violet-400/15 text-violet-200",
};

export function SecretTypeBadge({ type }: { type: SecretType }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[type]}`}>
      {SECRET_TYPE_LABELS[type]}
    </span>
  );
}
