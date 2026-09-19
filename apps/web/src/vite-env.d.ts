/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_IDLE_LOCK_MINUTES?: string;
  readonly VITE_JWT_REFRESH_BEFORE_SEC?: string;
  readonly VITE_CLIPBOARD_CLEAR_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
