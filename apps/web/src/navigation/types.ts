export type Tab = "home" | "vault" | "collections" | "settings";

export type AppRoute =
  | { screen: "tab"; tab: Tab }
  | { screen: "search" }
  | {
      screen: "collection";
      workspaceId: string;
      collectionId: string;
      collectionName: string;
    }
  | { screen: "secret"; secretId: string; title?: string };

export const DEFAULT_ROUTE: AppRoute = { screen: "tab", tab: "home" };
