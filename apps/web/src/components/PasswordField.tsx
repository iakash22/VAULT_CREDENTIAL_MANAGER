import { MASTER_PASSWORD_MIN } from "@vault/types";
import { useState } from "react";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  hint?: string;
}

function strengthLabel(password: string): { label: string; width: string; color: string } {
  if (password.length === 0) {
    return { label: "Enter a passphrase", width: "0%", color: "bg-white/20" };
  }
  if (password.length < MASTER_PASSWORD_MIN) {
    return { label: `At least ${MASTER_PASSWORD_MIN} characters`, width: "25%", color: "bg-rose-400" };
  }
  if (password.length < 16) {
    return { label: "Fair — longer is stronger", width: "55%", color: "bg-amber-300" };
  }
  if (password.length < 20) {
    return { label: "Good passphrase", width: "78%", color: "bg-accent-400" };
  }
  return { label: "Strong passphrase", width: "100%", color: "bg-accent-300" };
}

export function PasswordField({ id, label, value, onChange, autoComplete, hint }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const strength = strengthLabel(value);

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-500"
          placeholder="correct horse battery staple"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="shrink-0 text-xs text-slate-400 hover:text-white"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">{hint ?? strength.label}</p>
    </label>
  );
}
