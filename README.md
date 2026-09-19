# Vault

Self-hosted zero-knowledge secrets manager. Hierarchy: **Workspace → Collections → Secrets**.

Phase 2 adds master-password registration and login. The browser derives an
encryption key and a separate auth verifier. The API stores only a hash + salt.
There are still no encrypted secrets in the vault.

## Requirements

- Node.js 20+
- npm 10+
- Docker (for PostgreSQL)

## Setup

```powershell
copy .env.example .env
npm install
docker compose up -d postgres
npm test
npm run lint
npm run dev
```

- Web: http://localhost:5173 (register / login)
- API health: http://localhost:3001/api/v1/health
- API ready (Postgres): http://localhost:3001/api/v1/ready

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | API + web together |
| `npm run dev:api` | Fastify on :3001 |
| `npm run dev:web` | Vite on :5173 |
| `npm run dev:db` | Postgres in Docker |
| `npm test` | Workspace unit tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

Read [docs/SECURITY.md](docs/SECURITY.md) before changing crypto or auth.
