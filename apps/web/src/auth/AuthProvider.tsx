import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type Session } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);

  const lock = useCallback(() => {
    setSessionState(null);
  }, []);

  const setSession = useCallback((next: Session) => {
    setSessionState(next);
  }, []);

  useEffect(() => {
    if (!session) {
      return undefined;
    }
    const waitMs = Math.max(session.expiresAt - Date.now(), 0);
    const timer = window.setTimeout(lock, waitMs);
    return () => window.clearTimeout(timer);
  }, [lock, session]);

  const value = useMemo(() => ({ session, setSession, lock }), [lock, session, setSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
