import { useState } from "react";
import { useAuth } from "./auth/useAuth";
import { AppShell } from "./components/AppShell";
import type { Tab } from "./components/types";
import { AuthPage } from "./pages/Auth";
import { CollectionsPage } from "./pages/Collections";
import { SettingsPage } from "./pages/Settings";
import { VaultPage } from "./pages/Vault";

export function App() {
  const { session, lock } = useAuth();
  const [tab, setTab] = useState<Tab>("vault");

  if (!session) {
    return <AuthPage />;
  }

  return (
    <AppShell active={tab} onChange={setTab} username={session.user.username} onLock={lock}>
      {tab === "vault" ? <VaultPage /> : null}
      {tab === "collections" ? <CollectionsPage /> : null}
      {tab === "settings" ? <SettingsPage /> : null}
    </AppShell>
  );
}
