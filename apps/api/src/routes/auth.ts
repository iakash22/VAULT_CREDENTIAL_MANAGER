import { KDF_DEFAULTS } from "@vault/crypto";
import type { FastifyInstance } from "fastify";
import { dummyKdfParams } from "../auth/dummyKdf.js";
import { signAccessToken } from "../auth/jwt.js";
import { kdfQuerySchema, loginBodySchema, parseOrThrow, registerBodySchema } from "../auth/schemas.js";
import {
  countUsers,
  findUserByUsername,
  insertUser,
  recordFailedLogin,
  resetFailedLogins,
} from "../auth/users.js";
import { hashAuthVerifier, verifiersMatch } from "../auth/verifier.js";
import { HttpError, requireDb } from "../httpError.js";

function hasPasswordField(body: unknown): boolean {
  return Boolean(body && typeof body === "object" && ("password" in body || "masterPassword" in body));
}

const AUTH_RATE_LIMIT = {
  max: 10,
  timeWindow: "15 minutes",
} as const;

function assertClientKdfStrength(memoryKiB: number, iterations: number, env: string): void {
  const minMemory = env === "test" ? 8 : 8_192;
  const minIterations = env === "test" ? 1 : 2;
  if (memoryKiB < minMemory || iterations < minIterations) {
    throw new HttpError(400, "KDF parameters are too weak");
  }
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/register",
    { config: { rateLimit: AUTH_RATE_LIMIT } },
    async (request, reply) => {
      if (hasPasswordField(request.body)) {
        return reply.status(400).send({ error: "Master password must not be sent to the server" });
      }
      const db = requireDb(app.db);
      const body = parseOrThrow(registerBodySchema, request.body);
      assertClientKdfStrength(body.kdf.memoryKiB, body.kdf.iterations, app.config.NODE_ENV);

      if (app.config.SINGLE_USER_MODE && (await countUsers(db)) >= 1) {
        throw new HttpError(409, "Registration is closed on this single-user vault");
      }

      if (await findUserByUsername(db, body.username)) {
        throw new HttpError(409, "Username is already taken");
      }

      const hashed = await hashAuthVerifier(body.authVerifier);
      const user = await insertUser(db, {
        username: body.username,
        authHash: hashed.hash,
        authSalt: hashed.salt,
        kdf: body.kdf,
      });

      const token = await signAccessToken(user, app.config.JWT_SECRET, app.config.JWT_EXPIRES_SEC);
      reply.status(201);
      return {
        token,
        expiresIn: app.config.JWT_EXPIRES_SEC,
        user: { id: user.id, username: user.username },
      };
    },
  );

  app.post("/login", { config: { rateLimit: AUTH_RATE_LIMIT } }, async (request, reply) => {
    if (hasPasswordField(request.body)) {
      return reply.status(400).send({ error: "Master password must not be sent to the server" });
    }
    const db = requireDb(app.db);
    const body = parseOrThrow(loginBodySchema, request.body);
    const user = await findUserByUsername(db, body.username);

    const hashed = await hashAuthVerifier(body.authVerifier, user?.authSalt);
    const ok = Boolean(user && verifiersMatch(hashed.hash, user.authHash));

    if (!user || !ok) {
      if (user) {
        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
          throw new HttpError(423, "Account is locked. Try again later.");
        }
        await recordFailedLogin(
          db,
          user.id,
          app.config.AUTH_LOCKOUT_THRESHOLD,
          app.config.AUTH_LOCKOUT_MINUTES,
        );
      }
      throw new HttpError(401, "Invalid username or password");
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new HttpError(423, "Account is locked. Try again later.");
    }

    await resetFailedLogins(db, user.id);
    const token = await signAccessToken(user, app.config.JWT_SECRET, app.config.JWT_EXPIRES_SEC);
    return {
      token,
      expiresIn: app.config.JWT_EXPIRES_SEC,
      user: { id: user.id, username: user.username },
    };
  });

  app.get("/kdf-params", { config: { rateLimit: AUTH_RATE_LIMIT } }, async (request) => {
    const db = requireDb(app.db);
    const query = parseOrThrow(kdfQuerySchema, request.query);
    const user = await findUserByUsername(db, query.username);
    return {
      kdf: user?.kdf ?? dummyKdfParams(query.username, app.config.JWT_SECRET),
    };
  });

  app.post("/refresh", { preHandler: app.authenticate, config: { rateLimit: AUTH_RATE_LIMIT } }, async (request) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    const token = await signAccessToken(request.user, app.config.JWT_SECRET, app.config.JWT_EXPIRES_SEC);
    return {
      token,
      expiresIn: app.config.JWT_EXPIRES_SEC,
      user: request.user,
    };
  });

  app.get("/me", { preHandler: app.authenticate }, async (request) => {
    if (!request.user) {
      throw new HttpError(401, "Unauthorized");
    }
    return request.user;
  });

  app.get("/defaults", async () => ({
    kdf: {
      algorithm: KDF_DEFAULTS.algorithm,
      memoryKiB: KDF_DEFAULTS.memoryKiB,
      iterations: KDF_DEFAULTS.iterations,
      parallelism: KDF_DEFAULTS.parallelism,
      hashLength: KDF_DEFAULTS.hashLength,
    },
  }));
}
