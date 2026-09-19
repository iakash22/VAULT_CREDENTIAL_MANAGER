CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  auth_hash TEXT NOT NULL,
  auth_salt TEXT NOT NULL,
  kdf_algorithm TEXT NOT NULL,
  kdf_salt TEXT NOT NULL,
  kdf_memory_kib INTEGER NOT NULL,
  kdf_iterations INTEGER NOT NULL,
  kdf_parallelism INTEGER NOT NULL,
  kdf_hash_length INTEGER NOT NULL,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_vault_keys (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  wrapped_key JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS workspaces_user_id_idx ON workspaces(user_id);

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collections_workspace_id_idx ON collections(workspace_id);
CREATE INDEX IF NOT EXISTS collections_parent_id_idx ON collections(parent_id);
CREATE INDEX IF NOT EXISTS collections_user_workspace_idx ON collections(user_id, workspace_id);

DO $$ BEGIN
  CREATE TYPE "SecretType" AS ENUM ('password', 'ssh', 'token', 'env');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_type "SecretType" NOT NULL DEFAULT 'password',
  title TEXT NOT NULL DEFAULT 'Untitled',
  tags TEXT[] NOT NULL DEFAULT '{}',
  encrypted_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS secrets_workspace_id_idx ON secrets(workspace_id);
CREATE INDEX IF NOT EXISTS secrets_collection_id_idx ON secrets(collection_id);
CREATE INDEX IF NOT EXISTS secrets_user_workspace_idx ON secrets(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS secrets_user_secret_type_idx ON secrets(user_id, secret_type);
CREATE INDEX IF NOT EXISTS secrets_title_idx ON secrets(title);
CREATE INDEX IF NOT EXISTS secrets_tags_gin_idx ON secrets USING GIN (tags);
