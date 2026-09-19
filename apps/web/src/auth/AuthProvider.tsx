import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { refreshSession as refreshSessionApi } from "../lib/authApi";
import { cancelClipboardClearTimers } from "../lib/clipboard";
import { IDLE_LOCK_MINUTES, JWT_REFRESH_BEFORE_SEC } from "../lib/securityConfig";
import { AuthContext, type Session } from "./authContext";

const IDLE_LOCK_MS = IDLE_LOCK_MINUTES * 60_000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const lastActivityRef = useRef(Date.now());
  const refreshInFlightRef = useRef(false);

  const lock = useCallback(() => {
    cancelClipboardClearTimers();
    setSessionState(null);
  }, []);

  const setSession = useCallback((next: Session) => {
    lastActivityRef.current = Date.now();
    setSessionState(next);
  }, []);

  const refreshSession = useCallback((token: string, expiresInSec: number) => {
    setSessionState((current) =>
      current
        ? {
            ...current,
            token,
            expiresAt: Date.now() + expiresInSec * 1000,
          }
        : null,
    );
  }, []);

  // JWT expiry lock
  useEffect(() => {
    if (!session) {
      return undefined;
    }
    const waitMs = Math.max(session.expiresAt - Date.now(), 0);
    const timer = window.setTimeout(lock, waitMs);
    return () => window.clearTimeout(timer);
  }, [lock, session]);

  // Silent JWT refresh before expiry
  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const tick = async () => {
      const remainingSec = (session.expiresAt - Date.now()) / 1000;
      if (remainingSec > JWT_REFRESH_BEFORE_SEC || refreshInFlightRef.current) {
        return;
      }
      refreshInFlightRef.current = true;
      try {
        const refreshed = await refreshSessionApi(session.token);
        refreshSession(refreshed.token, refreshed.expiresIn);
      } catch {
        lock();
      } finally {
        refreshInFlightRef.current = false;
      }
    };

    const interval = window.setInterval(() => {
      void tick();
    }, 30_000);
    void tick();
    return () => window.clearInterval(interval);
  }, [lock, refreshSession, session]);

  // Idle auto-lock
  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const bump = () => {
      lastActivityRef.current = Date.now();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, bump, { passive: true });
    }

    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_LOCK_MS) {
        lock();
      }
    }, 10_000);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, bump);
      }
      window.clearInterval(interval);
    };
  }, [lock, session]);

  // Lock when tab stays hidden too long (same idle threshold)
  useEffect(() => {
    if (!session) {
      return undefined;
    }
    const onVisibility = () => {
      if (document.hidden && Date.now() - lastActivityRef.current >= IDLE_LOCK_MS) {
        lock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [lock, session]);

  const value = useMemo(
    () => ({ session, setSession, refreshSession, lock }),
    [lock, refreshSession, session, setSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
