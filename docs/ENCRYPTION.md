# Encryption system (Phase 3)

This document explains how ciphertext is built, what the server is allowed to see, and how
to use the reusable crypto helpers.

## Primitives

| Layer | Algorithm | Purpose |
|---|---|---|
| Master password → key material | **Argon2id** | Slow, memory-hard derivation from the password |
| Key split | **HKDF-SHA-256** | Separate encryption key from auth verifier |
| Vault key wrap + secrets | **AES-256-GCM** | Encrypt data with authenticated integrity |

## IV (initialization vector)

AES-GCM requires a **nonce** called the IV. We use a **random 12-byte (96-bit) IV** for every
encryption operation.

- The IV is **not secret** — it is stored next to the ciphertext in the `EncryptedPayload`.
- It **must be unique** for each encryption under the same key. Reusing an IV with the same key
  destroys GCM security.
- We generate it with `crypto.getRandomValues()` (`randomBytes(12)`).

In the payload envelope:

```json
{ "iv": "<base64 of 12 random bytes>", ... }
```

## Authentication tag

GCM produces a **128-bit authentication tag** appended to the ciphertext. It proves that:

1. The ciphertext was not truncated or flipped in storage or transit.
2. The optional **AAD** (additional authenticated data) was not swapped.

The tag is **inside** the `ct` field (Web Crypto returns ciphertext + tag together). On decrypt,
if even one bit is wrong — wrong key, tampered blob, or mismatched AAD — decryption throws
`Decryption failed` instead of returning garbage.

## Why AES-GCM?

- **Confidentiality + integrity in one step** — no encrypt-then-MAC wiring mistakes.
- **Hardware acceleration** in browsers and Node via Web Crypto.
- **Standard choice** for envelope encryption at rest (NIST SP 800-38D).

We do **not** use AES-CBC (no built-in integrity) or AES-CTR alone (needs a separate MAC).

## EncryptedPayload envelope

The server stores this JSON as an opaque blob. It cannot read the contents.

```typescript
interface EncryptedPayload {
  v: 1;                  // schema version
  alg: "AES-256-GCM";
  iv: string;            // base64, 12 bytes
  ct: string;            // base64 ciphertext + 128-bit GCM tag
  aad?: string;          // optional base64 context (e.g. "secret-v1")
}
```

The API validates structure and sizes with `validateEncryptedPayload()` — it never decrypts.

## Key hierarchy

```
Master password
    └── Argon2id + HKDF
            ├── encryptionKey  (RAM) ──wrap/unwrap──► vaultKey (RAM)
            └── authVerifier   (HTTPS once) ──► server auth hash

vaultKey ──AES-GCM──► encrypted secrets (Phase 4)
```

## Reusable functions (`@vault/crypto`)

| Function | Use |
|---|---|
| `deriveMasterKeySet(password)` | Argon2id + HKDF split on login/register |
| `generateVaultKey()` | Random 256-bit vault key |
| `wrapKey(vaultKey, encryptionKey)` | Encrypt vault key for server storage |
| `unwrapKey(payload, encryptionKey)` | Recover vault key on unlock |
| `encryptString(plaintext, key, aad?)` | Encrypt a string |
| `decryptString(payload, key)` | Decrypt a string |
| `encryptJson(value, key, aad?)` | Encrypt any JSON-serializable value |
| `decryptJson(payload, key)` | Decrypt back to typed JSON |
| `validateEncryptedPayload(input)` | Server-side structural validation |

## Example encrypt/decrypt flow

Full runnable example: `packages/crypto/src/example.ts` (also tested in `example.test.ts`).

```typescript
import {
  deriveMasterKeySet,
  generateVaultKey,
  wrapKey,
  unwrapKey,
  encryptJson,
  decryptJson,
} from "@vault/crypto";

// 1. User unlocks with master password (client only)
const { encryptionKey } = await deriveMasterKeySet("user master password here");

// 2. Generate and wrap vault key for the server
const vaultKey = generateVaultKey();
const wrappedKey = await wrapKey(vaultKey, encryptionKey);
// → PUT /api/v1/vault/key { wrappedKey }  (server stores JSONB, cannot decrypt)

// 3. On next login, fetch and unwrap
const unwrappedVaultKey = await unwrapKey(wrappedKey, encryptionKey);

// 4. Encrypt a secret (Phase 4 will persist the blob)
const secret = { title: "GitHub", username: "you", password: "••••" };
const encrypted = await encryptJson(secret, unwrappedVaultKey, "secret-v1");
// → server would store `encrypted` only

// 5. Decrypt locally
const plain = await decryptJson<typeof secret>(encrypted, unwrappedVaultKey);
```

Or run the bundled helper:

```typescript
import { runEncryptDecryptFlow } from "@vault/crypto";

const result = await runEncryptDecryptFlow("master password");
console.log(result.decryptedSecret.title); // "Example login"
```

## Web app helpers (`apps/web/src/lib/vaultCrypto.ts`)

- `createWrappedVaultKey(encryptionKey)` — register flow
- `unlockVaultKey(encryptionKey, wrappedKey)` — login flow
- `encryptSecret(vaultKey, draft)` / `decryptSecret(vaultKey, payload)` — Phase 4 preview
