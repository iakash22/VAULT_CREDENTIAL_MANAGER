import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import type { Tab } from "../navigation/types";

interface AppShellProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  username: string;
  onLock: () => void;
  children: ReactNode;
}

const desktopNav: Array<{ id: Tab; label: string }> = [
  { id: "home", label: "Home" },
  { id: "vault", label: "Vault" },
  { id: "collections", label: "Collections" },
  { id: "settings", label: "Settings" },
];

export function AppShell({ active, onChange, username, onLock, children }: AppShellProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 animate-pulseGlow rounded-full bg-accent-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-40 h-72 w-72 animate-pulseGlow rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="mx-auto flex min-h-dvh max-w-6xl gap-6 px-4 py-5 md:px-8 md:py-8">
        <aside className="glass-panel hidden w-64 shrink-0 flex-col rounded-3xl p-5 md:flex">
          <Brand />
          <div className="mt-8 flex flex-1 flex-col gap-2">
            {desktopNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-300 ${
                  active === item.id ? "bg-white/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onLock}
            className="mt-auto rounded-2xl border border-white/10 px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5"
          >
            Lock · {username}
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="mb-5 flex items-center justify-between md:hidden">
            <Brand />
            <button
              type="button"
              onClick={onLock}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-slate-300"
            >
              Lock
            </button>
          </header>
          <main className="safe-bottom animate-fade-up md:pb-0">{children}</main>
        </div>
      </div>

      <BottomNav active={active} onChange={onChange} />
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent-400/20 text-accent-300">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3l8 4.5v6.2c0 4.2-3.4 7.8-8 9.3-4.6-1.5-8-5.1-8-9.3V7.5L12 3z" />
          <path d="M9.5 12.2l1.8 1.8 3.4-3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <p className="font-display text-lg font-semibold leading-none">Vault</p>
        <p className="mt-1 text-xs text-slate-400">Zero-knowledge secrets</p>
      </div>
    </div>
  );
}
