import { useCallback, useState } from "react";
import { useAuth } from "./auth/useAuth";
import { AppShell } from "./components/AppShell";
import { AuthPage } from "./pages/Auth";
import { CollectionDetailPage } from "./pages/CollectionDetail";
import { CollectionsPage } from "./pages/Collections";
import { HomePage } from "./pages/Home";
import { SearchPage } from "./pages/Search";
import { SecretDetailPage } from "./pages/SecretDetail";
import { SettingsPage } from "./pages/Settings";
import { VaultPage } from "./pages/Vault";
import { DEFAULT_ROUTE, type AppRoute, type Tab } from "./navigation/types";

export function App() {
  const { session, lock } = useAuth();
  const [route, setRoute] = useState<AppRoute>(DEFAULT_ROUTE);
  const [history, setHistory] = useState<AppRoute[]>([]);

  const navigate = useCallback((next: AppRoute) => {
    setHistory((stack) => [...stack, route]);
    setRoute(next);
  }, [route]);

  const goBack = useCallback(() => {
    setHistory((stack) => {
      const previous = stack[stack.length - 1] ?? DEFAULT_ROUTE;
      setRoute(previous);
      return stack.slice(0, -1);
    });
  }, []);

  const setTab = useCallback((tab: Tab) => {
    setHistory([]);
    setRoute({ screen: "tab", tab });
  }, []);

  if (!session) {
    return <AuthPage />;
  }

  const activeTab: Tab = route.screen === "tab" ? route.tab : inferTab(route);

  return (
    <AppShell active={activeTab} onChange={setTab} username={session.user.username} onLock={lock}>
      {route.screen === "tab" && route.tab === "home" ? <HomePage onNavigate={navigate} /> : null}
      {route.screen === "tab" && route.tab === "vault" ? (
        <VaultPage onOpenSecret={(secretId, title) => navigate({ screen: "secret", secretId, title })} />
      ) : null}
      {route.screen === "tab" && route.tab === "collections" ? (
        <CollectionsPage
          onOpenCollection={(workspaceId, collectionId, collectionName) =>
            navigate({ screen: "collection", workspaceId, collectionId, collectionName })
          }
          onOpenSecret={(secretId, title) => navigate({ screen: "secret", secretId, title })}
        />
      ) : null}
      {route.screen === "tab" && route.tab === "settings" ? <SettingsPage /> : null}
      {route.screen === "search" ? <SearchPage onBack={goBack} onOpenSecret={(id, title) => navigate({ screen: "secret", secretId: id, title })} /> : null}
      {route.screen === "collection" ? (
        <CollectionDetailPage
          workspaceId={route.workspaceId}
          collectionId={route.collectionId}
          collectionName={route.collectionName}
          onNavigate={navigate}
          onBack={goBack}
        />
      ) : null}
      {route.screen === "secret" ? (
        <SecretDetailPage
          secretId={route.secretId}
          fallbackTitle={route.title}
          onBack={goBack}
          onDeleted={() => undefined}
        />
      ) : null}
    </AppShell>
  );
}

function inferTab(route: AppRoute): Tab {
  if (route.screen === "secret" || route.screen === "collection") {
    return "vault";
  }
  return "home";
}
