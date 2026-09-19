import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  delay?: number;
}

export function GlassCard({ children, className = "", interactive = false, delay }: GlassCardProps) {
  const stagger = delay === 1 ? "stagger-1" : delay === 2 ? "stagger-2" : delay === 3 ? "stagger-3" : "";
  return (
    <div
      className={`page-enter rounded-[var(--radius-xl)] p-5 md:p-6 ${stagger} ${
        interactive ? "glass-panel-interactive" : "glass-panel"
      } ${className}`}
    >
      {children}
    </div>
  );
}
