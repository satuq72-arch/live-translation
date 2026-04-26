import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { clerkPlugin } from '@clerk/fastify';
import 'dotenv/config';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string;
  }
}

const app = Fastify({ logger: true });

// Plugins
app.register(cors, { origin: process.env.FRONTEND_URL || 'http://localhost:3000' });
app.register(websocket);
app.register(clerkPlugin);

// Raw body preservation for Stripe webhook signature verification
app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
  _req.rawBody = body as string;
  try { done(null, JSON.parse(body as string)); }
  catch (err: any) { done(err, undefined); }
});

// Routes (werden in den jeweiligen Schritten hinzugefügt)
app.register(import('./routes/ws'),     { prefix: '/ws'     });
app.register(import('./routes/stripe'), { prefix: '/stripe' });
app.register(import('./routes/usage'),  { prefix: '/usage'  });

// Health check
app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 API running on http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
