#!/usr/bin/env bash
# Issue Let's Encrypt certificates and switch nginx to HTTPS.
# Usage: ./infra/scripts/init-letsencrypt.sh vault.example.com admin@example.com
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

DOMAIN="${1:-}"
EMAIL="${2:-}"
STAGING="${STAGING:-0}"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Usage: $0 <domain> <email>" >&2
  echo "Optional: STAGING=1 $0 <domain> <email>" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Copy .env.example to .env and set production secrets first." >&2
  exit 1
fi

export VAULT_DOMAIN="$DOMAIN"
BASE="docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production"
BOOT="$BASE -f docker-compose.prod.bootstrap.yml"

echo "==> Building images"
$BASE build

echo "==> Starting stack (HTTP bootstrap nginx)"
$BOOT up -d postgres api web nginx

echo "==> Waiting for API health"
for _ in $(seq 1 30); do
  if $BOOT exec api wget -qO- http://127.0.0.1:3001/api/v1/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Requesting certificate for $DOMAIN"
STAGING_FLAG=""
if [[ "$STAGING" == "1" ]]; then
  STAGING_FLAG="--staging"
fi

$BASE run --rm certbot certonly --webroot -w /var/www/certbot \
  $STAGING_FLAG \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

echo "==> Rendering production nginx config"
export VAULT_DOMAIN="$DOMAIN"
envsubst '${VAULT_DOMAIN}' < infra/nginx/nginx.prod.template.conf > infra/nginx/nginx.active.conf

echo "==> Enabling HTTPS nginx + certbot renew loop"
$BASE up -d --force-recreate nginx certbot

echo "==> Done. Open https://$DOMAIN"
echo "Set VAULT_DOMAIN=$DOMAIN and CORS_ORIGIN=https://$DOMAIN in .env for future deploys."
