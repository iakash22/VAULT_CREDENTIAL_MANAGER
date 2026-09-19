interface BackBarProps {
  label: string;
  onBack: () => void;
}

export function BackBar({ label, onBack }: BackBarProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-4 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
        <path d="M12.7 5.3a1 1 0 00-1.4-1.4L6 9.2a1 1 0 000 1.4l5.3 5.3a1 1 0 001.4-1.4L8.4 10l4.3-4.7z" />
      </svg>
      {label}
    </button>
  );
}
