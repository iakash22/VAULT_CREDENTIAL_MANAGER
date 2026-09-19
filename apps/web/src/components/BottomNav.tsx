import type { Tab } from "./types";

const items: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "vault", label: "Vault", icon: "M12 3l8 4.5v6.2c0 4.2-3.4 7.8-8 9.3-4.6-1.5-8-5.1-8-9.3V7.5L12 3z" },
  { id: "collections", label: "Collections", icon: "M4 7h16M4 12h16M4 17h10" },
  { id: "settings", label: "Settings", icon: "M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM4 12h2m12 0h2M6.6 6.6l1.4 1.4m8 8l1.4 1.4M6.6 17.4l1.4-1.4m8-8l1.4-1.4" },
];

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="glass-panel mx-auto grid max-w-md grid-cols-3 rounded-2xl p-1.5">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-xs transition-all duration-300 ${
                selected ? "bg-white/15 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
