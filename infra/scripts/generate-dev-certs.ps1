# Self-signed TLS for local docker compose --profile full
$ErrorActionPreference = "Stop"
$certDir = Join-Path $PSScriptRoot "..\nginx\certs"
New-Item -ItemType Directory -Force -Path $certDir | Out-Null

$key = Join-Path $certDir "dev.key"
$crt = Join-Path $certDir "dev.crt"

if (Test-Path $crt) {
  Write-Host "Certs already exist at $certDir — delete them to regenerate."
  exit 0
}

openssl req -x509 -nodes -days 825 -newkey rsa:2048 `
  -keyout $key -out $crt `
  -subj "/CN=vault.local/O=Vault Dev"

Write-Host "Created $crt and $key"
