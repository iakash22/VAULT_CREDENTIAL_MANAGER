#!/usr/bin/env bash
set -euo pipefail

CERT_DIR="$(cd "$(dirname "$0")/../nginx/certs" && pwd)"
mkdir -p "$CERT_DIR"

if [[ -f "$CERT_DIR/dev.crt" ]]; then
  echo "Certs already exist in $CERT_DIR — delete them to regenerate."
  exit 0
fi

openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout "$CERT_DIR/dev.key" \
  -out "$CERT_DIR/dev.crt" \
  -subj "/CN=vault.local/O=Vault Dev"

echo "Created $CERT_DIR/dev.crt and dev.key"
