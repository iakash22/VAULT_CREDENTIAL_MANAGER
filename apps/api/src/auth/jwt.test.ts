import { describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "./jwt.js";

const SECRET = "a".repeat(32);

describe("JWT", () => {
  it("round-trips claims and rejects a tampered token", async () => {
    const token = await signAccessToken({ id: "user-1", username: "ada" }, SECRET, 900);
    await expect(verifyAccessToken(token, SECRET)).resolves.toEqual({
      id: "user-1",
      username: "ada",
    });
    await expect(verifyAccessToken(`${token}x`, SECRET)).rejects.toThrow();
  });
});
