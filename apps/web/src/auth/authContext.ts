import { createContext } from "react";
import type { AuthUser } from "@vault/types";

export interface Session {
  token: string;
  expiresAt: number;
  user: AuthUser;
  /** Master-derived key used only to wrap/unwrap the vault key. RAM only. */
  encryptionKey: Uint8Array;
  /** Random vault key used to encrypt secrets. RAM only. */
  vaultKey: Uint8Array;
}

export interface AuthContextValue {
  session: Session | null;
  setSession: (session: Session) => void;
  /** Update JWT after a silent refresh without dropping keys. */
  refreshSession: (token: string, expiresInSec: number) => void;
  lock: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
