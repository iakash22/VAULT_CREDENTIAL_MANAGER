import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.2em] text-accent-300">{eyebrow}</p>
        ) : null}
        <h1 className={`font-display text-3xl font-semibold ${eyebrow ? "mt-2" : ""}`}>{title}</h1>
        {description ? (
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
