import { describe, expect, it } from "vitest";
import { encryptString } from "./aes.js";
import { generateVaultKey } from "./random.js";
import { validateEncryptedPayload } from "./validate.js";

describe("validateEncryptedPayload", () => {
  it("accepts a well-formed payload", async () => {
    const payload = await encryptString("test", generateVaultKey());
    expect(validateEncryptedPayload(payload)).toEqual(payload);
  });

  it("rejects wrong version", async () => {
    const payload = await encryptString("test", generateVaultKey());
    expect(() => validateEncryptedPayload({ ...payload, v: 2 })).toThrow(/version/i);
  });

  it("rejects unknown fields", async () => {
    const payload = await encryptString("test", generateVaultKey());
    expect(() => validateEncryptedPayload({ ...payload, extra: "x" })).toThrow(/Unknown field/i);
  });

  it("rejects non-objects", () => {
    expect(() => validateEncryptedPayload("not-an-object")).toThrow(/object/i);
  });
});
