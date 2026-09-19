import { createContext } from "react";
import type { AuthUser } from "@vault/types";

export interface Session {
  token: string;
  expiresAt: number;
  user: AuthUser;
  /** Held only in RAM. Never written to localStorage or sent back to the API. */
  encryptionKey: Uint8Array;
}

export interface AuthContextValue {
  session: Session | null;
  setSession: (session: Session) => void;
  lock: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
