import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken } from "../auth/jwt.js";

export async function authenticatePlugin(app: FastifyInstance): Promise<void> {
  app.decorateRequest("user", null);

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      request.user = await verifyAccessToken(header.slice("Bearer ".length), app.config.JWT_SECRET);
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });
}
