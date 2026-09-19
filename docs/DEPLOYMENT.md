# Deployment (Phase 10)

Self-host Vault with **Docker**, **PostgreSQL**, **Nginx**, and **Let's Encrypt** TLS.

## Architecture

```
Internet ──► Nginx (:443 TLS)
                 ├── /        → Web (static React)
                 └── /api/    → API (Fastify :3001)
                                    └── PostgreSQL (:5432, internal)
Certbot ──► renews certs (webroot, shared volume)
```

All containers share the default Compose network. Postgres is not exposed in production.

## Requirements

| Item | Notes |
|------|--------|
| Linux VPS | Ubuntu 22.04+ recommended (1 vCPU, 1 GB RAM minimum) |
| Domain | DNS `A` record → server public IP |
| Docker | Engine 24+ and Compose v2 |
| Ports | 80 and 443 open to the world (unless using private Tailscale access) |

## 1. Prepare the server

```bash
sudo apt update && sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# log out and back in
```

Clone the repo and create production env:

```bash
git clone <your-repo-url> vault
cd vault
cp .env.example .env
```

Edit `.env` — **required for production**:

```env
NODE_ENV=production
VAULT_DOMAIN=vault.example.com
CORS_ORIGIN=https://vault.example.com

POSTGRES_USER=vault
POSTGRES_PASSWORD=<long-random-password>
POSTGRES_DB=vault

JWT_SECRET=<node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))">

# Web build uses same-origin /api through nginx
VITE_API_BASE_URL=
```

## 2. Issue TLS certificates (first deploy)

Point `vault.example.com` at the server, then:

```bash
chmod +x infra/scripts/init-letsencrypt.sh
./infra/scripts/init-letsencrypt.sh vault.example.com you@example.com
```

This script:

1. Builds images and starts Postgres, API, Web, and Nginx (HTTP bootstrap config).
2. Runs Certbot `certonly --webroot` for your domain.
3. Renders `infra/nginx/nginx.active.conf` from the production template.
4. Restarts Nginx with HTTPS and starts the Certbot renew loop (every 12 h).

**Staging test** (avoid rate limits while experimenting):

```bash
STAGING=1 ./infra/scripts/init-letsencrypt.sh vault.example.com you@example.com
```

## 3. Routine production deploys

After the first TLS setup:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build
```

Verify:

```bash
curl -s https://vault.example.com/api/v1/health | jq
curl -s https://vault.example.com/api/v1/ready | jq
```

Register the first user in the browser at `https://vault.example.com`.

## Local full stack (self-signed HTTPS)

For testing the Docker stack on your machine:

```powershell
# Windows
.\infra\scripts\generate-dev-certs.ps1
docker compose --profile full up -d --build
```

```bash
# Linux / macOS
chmod +x infra/scripts/generate-dev-certs.sh
./infra/scripts/generate-dev-certs.sh
docker compose --profile full up -d --build
```

Open `https://localhost` (accept the self-signed warning). Dev certs live in `infra/nginx/certs/`.

## Compose profiles

| Profile | Services | Use case |
|---------|----------|----------|
| *(default)* | `postgres` | Local dev with `npm run dev` |
| `full` | postgres, api, web, nginx | Local HTTPS stack |
| `production` | postgres, api, web, nginx, certbot | VPS deployment |

## Optional: Tailscale private access

Skip public HTTPS and reach Vault only on your tailnet:

1. Install Tailscale on the **host** (not inside a container):

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2. Block public Postgres and optionally public HTTPS:

   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow in on tailscale0 to any port 443 proto tcp
   sudo ufw deny 5432
   # sudo ufw deny 443   # if you do not want public HTTPS
   ```

3. Deploy with Postgres not published:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml \
     -f docker-compose.tailscale.yml --profile production up -d --build
   ```

4. Open `https://100.x.x.x` (from `tailscale ip`) or MagicDNS `https://vault.<tailnet>.ts.net`.

For private hosts without public HTTP, use **Let's Encrypt DNS challenge** or self-signed dev certs instead of `init-letsencrypt.sh`.

## Operations

| Task | Command |
|------|---------|
| Logs | `docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production logs -f` |
| Restart API | `docker compose ... restart api` |
| DB backup | `docker compose exec postgres pg_dump -U vault vault > backup.sql` |
| Renew certs manually | `docker compose ... run --rm certbot renew --webroot -w /var/www/certbot` |
| Pull + rebuild | `git pull && docker compose ... up -d --build` |

## Security checklist

- [ ] Strong `POSTGRES_PASSWORD` and `JWT_SECRET` in `.env` (never commit `.env`)
- [ ] `CORS_ORIGIN` matches your exact HTTPS origin
- [ ] Postgres port **not** exposed publicly (prod compose sets `ports: []`)
- [ ] Firewall: only 22, 80, 443 (or Tailscale-only 443)
- [ ] Register one user in single-user mode, then keep `SINGLE_USER_MODE=true`
- [ ] Automated Certbot renewal container running

## Troubleshooting

**Nginx fails after prod up — missing `nginx.active.conf`**

Run `init-letsencrypt.sh` once, or render manually:

```bash
export VAULT_DOMAIN=vault.example.com
envsubst '${VAULT_DOMAIN}' < infra/nginx/nginx.prod.template.conf > infra/nginx/nginx.active.conf
```

**Certbot HTTP-01 fails**

Confirm DNS points to this server and port 80 is reachable from the internet.

**API `Production CORS_ORIGIN` error**

Set `CORS_ORIGIN=https://your-domain` (no trailing slash) and rebuild if needed.

**502 from Nginx**

Wait for API healthcheck: `docker compose ... logs api`
