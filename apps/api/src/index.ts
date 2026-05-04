import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { clerkPlugin } from '@clerk/fastify';
import { supabase } from '@saas/core/db/client';
import 'dotenv/config';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string;
  }
}

const app = Fastify({ logger: true });

// Plugins
// Strip trailing slash so CORS exact-match works regardless of how FRONTEND_URL is set
const allowedOrigin = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
app.register(cors, { origin: allowedOrigin });
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

// Full connectivity check — tests Supabase and Deepgram without auth
app.get('/health/full', async (_req, reply) => {
  const results: Record<string, string> = {};

  // Env var presence (not values)
  results.supabase_url      = process.env.SUPABASE_URL              ? 'set' : 'MISSING';
  results.supabase_role_key = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING';
  results.deepgram_key      = process.env.DEEPGRAM_API_KEY          ? 'set' : 'MISSING';
  results.deepl_key         = process.env.DEEPL_API_KEY             ? 'set' : 'MISSING';
  results.clerk_key         = process.env.CLERK_SECRET_KEY          ? 'set' : 'MISSING';

  // Test Supabase only if creds are present
  if (results.supabase_url === 'set' && results.supabase_role_key === 'set') {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      results.supabase = error ? `error: ${error.message}` : 'ok';
    } catch (e: any) {
      results.supabase = `exception: ${e.message}`;
    }
  } else {
    results.supabase = 'skipped (missing env vars)';
  }

  // Test Deepgram key via REST (no WebSocket needed)
  if (results.deepgram_key === 'set') {
    try {
      const resp = await fetch('https://api.deepgram.com/v1/auth/token', {
        headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      results.deepgram = resp.ok ? 'ok' : `http_${resp.status}`;
    } catch (e: any) {
      results.deepgram = `exception: ${e.message}`;
    }
  } else {
    results.deepgram = 'skipped (missing key)';
  }

  const allOk = results.supabase === 'ok' &&
    results.deepgram         === 'ok' &&
    results.supabase_url      === 'set' &&
    results.supabase_role_key === 'set' &&
    results.deepgram_key      === 'set' &&
    results.deepl_key         === 'set' &&
    results.clerk_key         === 'set';

  return reply.code(allOk ? 200 : 503).send({ status: allOk ? 'ok' : 'degraded', ...results });
});

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
