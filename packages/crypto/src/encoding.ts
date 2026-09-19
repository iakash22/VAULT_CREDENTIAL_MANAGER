export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Expected a non-empty base64 string");
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function utf8Encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * WHY: compare password hashes / auth tags without leaking how many bytes matched.
 * Length is still visible if the two buffers differ in size — callers should
 * always compare equal-length digests.
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.byteLength; i += 1) {
    mismatch |= a[i]! ^ b[i]!;
  }
  return mismatch === 0;
}

export function assertByteLength(bytes: Uint8Array, expected: number, label: string): void {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength !== expected) {
    throw new Error(`${label} must be ${expected} bytes`);
  }
}

/** Web Crypto's BufferSource types reject generic Uint8Array in TS 5.7+. */
export function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
