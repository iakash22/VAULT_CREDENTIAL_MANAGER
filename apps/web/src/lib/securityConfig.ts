const minutes = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const seconds = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/** Lock vault after this many minutes without interaction. */
export const IDLE_LOCK_MINUTES = minutes(import.meta.env.VITE_IDLE_LOCK_MINUTES, 15);

/** Clear clipboard this many ms after copying a secret field. */
export const CLIPBOARD_CLEAR_MS = seconds(import.meta.env.VITE_CLIPBOARD_CLEAR_MS, 30) * 1000;

/** Refresh JWT when this many seconds remain before expiry. */
export const JWT_REFRESH_BEFORE_SEC = seconds(import.meta.env.VITE_JWT_REFRESH_BEFORE_SEC, 120);
