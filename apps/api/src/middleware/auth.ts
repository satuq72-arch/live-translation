import type { FastifyRequest, FastifyReply } from 'fastify';

// Clerk JWT Middleware — schützt alle Routes
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.auth;
  if (!userId) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}
