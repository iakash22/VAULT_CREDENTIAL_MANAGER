# Vault

Self-hosted zero-knowledge secrets manager. Hierarchy: **Workspace → Collections → Secrets**.

Phase 10 adds Docker deployment (Postgres, API, Web, Nginx, Let's Encrypt). See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Security hardening:
[docs/SECURITY-HARDENING.md](docs/SECURITY-HARDENING.md).

```powershell
npm run db:generate -w @vault/api   # after schema changes
npm run db:migrate -w @vault/api    # production migrations
```

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

### Docker full stack (optional)

```powershell
.\infra\scripts\generate-dev-certs.ps1
docker compose --profile full up -d --build
```

HTTPS: https://localhost — production steps in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

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
