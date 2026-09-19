# Security model

This document is the contract the rest of the app must follow. If a later phase
breaks it, that phase is wrong.

## Threat model

We assume:

- The browser is trusted while unlocked.
- The server, database, and backups are **not** trusted with plaintext.
- Network observers may see traffic. HTTPS is mandatory outside localhost.
- An attacker may steal the database. They get salts, KDF params, and an
  Argon2id **auth hash** — not the encryption key and not secret plaintext.

We do **not** yet defend against a compromised client (malware, XSS, malicious
extension) or someone who already knows the master password.

## Password hash vs encryption key

These are **different** 32-byte values. Confusing them destroys zero-knowledge.

1. User types a master password. It is never stored and never sent.
2. Client: `masterMaterial = Argon2id(password, clientSalt)`.
3. Client splits that material with HKDF-SHA-256:
   - **Encryption key** = HKDF(masterMaterial, salt, `"vault-encryption-v1"`)
   - **Auth verifier** = HKDF(masterMaterial, salt, `"vault-auth-v1"`)
4. Only the auth verifier is POSTed to the API.
5. Server: `auth_hash = Argon2id(authVerifier, serverSalt)`.
6. Server stores `auth_hash`, `auth_salt`, and the public client KDF params.
   It never sees the encryption key.

| Value | Where it lives | What it is for |
|---|---|---|
| Master password | User's head | Input only |
| Encryption key | Browser RAM | Unlock vault ciphertext (Phase 3+) |
| Auth verifier | Sent once over HTTPS, then discarded | Prove the password is known |
| Auth hash + salts | Database | Verify login after a second Argon2id |

If the encryption key were stored or sent, a stolen database or a curious
admin could open the vault. The JWT only proves identity. It cannot decrypt.

## Why these primitives

**Argon2id** is memory-hard. A fast hash of a master password is GPU-cheap.

**HKDF** is the split. Same password, two unrelated keys.

**AES-256-GCM** encrypts the wrapped vault key and future secret blobs. See
[ENCRYPTION.md](./ENCRYPTION.md) for IV, auth tag, and payload format.

**Short JWT (15 minutes)** limits a stolen session token. The token is not a
key. Locking the tab drops both the JWT and the encryption key from memory.

**Lockout + rate limits** slow online guessing. They do not replace Argon2id.

## What the database stores

**`users`**: username, server auth hash, server salt, client KDF parameters,
failed-login counters. No encryption keys. No master passwords.

**`user_vault_keys` (Phase 3)**: one `EncryptedPayload` JSONB per user — the
vault key wrapped with the master-derived encryption key. The server validates
shape only; it cannot unwrap or read the vault key.

**`secrets` (Phase 6–7)**: `encrypted_payload` JSONB holds all sensitive fields.
`title`, `tags`, and `secret_type` are stored in plaintext so the server can
index and search without decryption. This is an intentional trade-off: an attacker
with the database learns what you named a secret, not the password/token inside it.

## Known JavaScript limitation

We cannot reliably wipe keys from RAM. Lock the vault when you step away.
