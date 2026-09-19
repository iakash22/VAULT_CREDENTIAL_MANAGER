import { SignJWT, jwtVerify } from "jose";

export interface AccessTokenClaims {
  id: string;
  username: string;
}

export async function signAccessToken(
  user: AccessTokenClaims,
  secret: string,
  expiresInSec: number,
): Promise<string> {
  return new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSec}s`)
    .sign(new TextEncoder().encode(secret));
}

export async function verifyAccessToken(token: string, secret: string): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    algorithms: ["HS256"],
  });

  if (typeof payload.sub !== "string" || typeof payload.username !== "string") {
    throw new Error("Invalid token");
  }

  return { id: payload.sub, username: payload.username };
}
