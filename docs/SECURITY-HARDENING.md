# Security hardening (Phase 9)

This document maps **attack vectors** to the **controls** implemented in Vault.

## Attack vectors and protections

### 1. Online password guessing (credential stuffing / brute force)

**Vector:** An attacker tries many master-password verifiers against `/auth/login`.

**Protections:**
- **Argon2id** on the client makes each guess expensive.
- **Per-route rate limit** on auth endpoints: 10 requests / 15 minutes (`AUTH_RATE_LIMIT` in `routes/auth.ts`).
- **Global rate limit** on all API routes (`RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW` in config).
- **Account lockout** after `AUTH_LOCKOUT_THRESHOLD` failed attempts for `AUTH_LOCKOUT_MINUTES` (`recordFailedLogin` in `auth/users.ts`).
- **Anti-enumeration:** unknown usernames receive dummy KDF params (`dummyKdf.ts`).

### 2. Stolen JWT / session hijacking

**Vector:** A short-lived bearer token is leaked via XSS, logs, or network sniffing (without HTTPS).

**Protections:**
- **Short JWT lifetime** (default 15 min, `JWT_EXPIRES_SEC`).
- **Silent refresh** (`POST /auth/refresh`) rotates the token before expiry without re-entering the master password.
- **Auto-lock** clears JWT + vault keys from RAM when idle or when JWT expires (`AuthProvider.tsx`).
- JWT proves **identity only** — it cannot decrypt secrets.

### 3. Idle workstation / shoulder surfing

**Vector:** User walks away with an unlocked tab.

**Protections:**
- **Idle auto-lock** (default 15 min, `VITE_IDLE_LOCK_MINUTES`) on mouse/keyboard/touch activity.
- **Manual lock** button in shell header.
- **Visibility check:** returning to a long-hidden tab locks if idle threshold exceeded.
- Lock wipes session state and **cancels clipboard clear timers**.

### 4. Clipboard exfiltration after copy

**Vector:** User copies a password; malware or another app reads the clipboard later.

**Protections:**
- **Auto-clear clipboard** after copy (default 30s, `VITE_CLIPBOARD_CLEAR_MS`) via `copyWithAutoClear()`.
- Used on Secret detail copy buttons only for sensitive fields.

### 5. API abuse / DoS

**Vector:** Flood of requests exhausts CPU, DB, or rate-limit budget.

**Protections:**
- Fastify **@fastify/rate-limit** globally.
- Stricter limits on auth routes.
- Request **body size cap** (64 KB in `app.ts`).
- Zod validation rejects malformed payloads early.

### 6. Database breach (server not trusted)

**Vector:** Attacker obtains PostgreSQL dump.

**Protections:**
- Secrets stored as **encrypted JSONB** only; server never sees vault key or master password.
- Auth verifiers are **Argon2id-hashed** again server-side.
- Search metadata (title, tags) is plaintext by design — see [SECURITY.md](./SECURITY.md).

### 7. Master password sent to server (zero-knowledge break)

**Vector:** Client bug sends plaintext password or encryption key.

**Protections:**
- API **rejects** bodies containing `password` or `masterPassword` (`auth/schemas.ts`).
- Integration tests assert rejection.

## Configuration reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `RATE_LIMIT_MAX` | 100 | Global API requests per window |
| `RATE_LIMIT_WINDOW` | 1 minute | Global window |
| `JWT_EXPIRES_SEC` | 900 | Access token TTL |
| `AUTH_LOCKOUT_THRESHOLD` | 8 | Failed logins before lock |
| `AUTH_LOCKOUT_MINUTES` | 15 | Lock duration |
| `VITE_IDLE_LOCK_MINUTES` | 15 | Frontend idle lock |
| `VITE_JWT_REFRESH_BEFORE_SEC` | 120 | Refresh when this many seconds remain |
| `VITE_CLIPBOARD_CLEAR_MS` | 30000 | Clipboard wipe delay |

## JWT refresh strategy

1. User logs in → receives JWT (15 min) + holds encryption/vault keys in RAM.
2. Frontend checks every 30s; when `< 2 min` remains, calls `POST /auth/refresh` with current token.
3. Server validates token, issues **new JWT** with fresh expiry.
4. Encryption keys stay in memory — user is not prompted again.
5. If refresh fails (revoked/expired), session **locks** immediately.

This limits the window for a stolen token while avoiding master-password re-entry every few minutes.
