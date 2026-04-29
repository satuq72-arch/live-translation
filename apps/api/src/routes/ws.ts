import type { FastifyPluginAsync } from 'fastify';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { sessionManager } from '@saas/core/ws-gateway/server';
import { UsageTracker }   from '@saas/core/usage/tracker';
import { canUseService }  from '@saas/core/billing/usage';
import { handleAudio }    from '../services/deepgram';
import { SUPPORTED_LANGUAGES } from '@saas/shared';
import type { WSErrorEvent } from '@saas/shared';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const wsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/translate', { websocket: true }, async (socket, req) => {

    // 1. Verify Clerk token from query parameter (cross-origin WS can't use cookies)
    const token = (req.query as any).token as string | undefined;
    if (!token) {
      socket.close(1008, 'Unauthorized');
      return;
    }

    let userId: string;
    try {
      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
      userId = payload.sub;
    } catch {
      socket.close(1008, 'Unauthorized');
      return;
    }

    // 2. Fetch email from Clerk so user can be created lazily if webhook hasn't fired yet
    let email: string | undefined;
    try {
      const clerkUser = await clerk.users.getUser(userId);
      email = clerkUser.emailAddresses[0]?.emailAddress;
    } catch { /* non-critical — canUseService falls back gracefully */ }

    // 3. Billing check
    const { allowed, reason } = await canUseService(userId, email);
    if (!allowed) {
      const err: WSErrorEvent = {
        type:    'error',
        code:    reason === 'USER_NOT_FOUND' ? 'AUTH_ERROR' : 'BILLING_LIMIT',
        message: reason === 'BILLING_LIMIT'
          ? 'Dein Kontingent ist aufgebraucht. Bitte abonniere einen Plan.'
          : 'Benutzer nicht gefunden.',
      };
      socket.send(JSON.stringify(err));
      socket.close(1000, reason);
      return;
    }

    let sessionId: string | null = null;
    let tracker:   UsageTracker | null = null;
    let cleaning = false;

    async function cleanup() {
      if (cleaning) return;
      cleaning = true;
      const sid = sessionId;
      const t   = tracker;
      sessionId = null;
      tracker   = null;
      try {
        if (sid) {
          await handleAudio.stop(sid);
          sessionManager.remove(sid);
        }
        if (t) await t.stop();
      } catch (err) {
        app.log.error({ err }, 'Error during WebSocket cleanup');
      }
    }

    socket.on('message', async (msg: Buffer) => {
      // Try JSON first; fall back to binary audio
      let event: any = null;
      if (msg[0] === 123 /* '{' */ || msg[0] === 91 /* '[' */) {
        try { event = JSON.parse(msg.toString()); } catch { /* not JSON */ }
      }

      if (event) {
        if (event.type === 'start') {
          if (sessionId) return;  // idempotency guard
          if (!event.sessionId) {
            socket.send(JSON.stringify({
              type: 'error', code: 'AUTH_ERROR', message: 'Missing sessionId',
            } satisfies WSErrorEvent));
            return;
          }

          const langs = Object.keys(SUPPORTED_LANGUAGES);
          if (!langs.includes(event.sourceLang) || !langs.includes(event.targetLang)) {
            socket.send(JSON.stringify({
              type: 'error', code: 'DEEPGRAM_ERROR',
              message: `Unsupported language. Supported: ${langs.join(', ')}`,
            } satisfies WSErrorEvent));
            return;
          }

          sessionId = event.sessionId as string;
          tracker   = new UsageTracker(userId, sessionId);
          sessionManager.add(userId, sessionId, socket as any);

          try {
            await handleAudio.start(userId, sessionId, event, (result) => {
              sessionManager.send(sessionId!, result);
              if ((result as any).type === 'final') {
                tracker!.tick(((result as any).duration ?? 0) / 60);
              }
            });
          } catch (err: any) {
            socket.send(JSON.stringify({
              type: 'error', code: 'DEEPGRAM_ERROR', message: err.message,
            } satisfies WSErrorEvent));
          }
        }

        if (event.type === 'stop') {
          await cleanup();
        }

      } else {
        // Binary PCM audio → Deepgram
        if (sessionId) handleAudio.sendAudio(sessionId, msg);
      }
    });

    socket.on('close', () => { cleanup(); });
  });
};

export default wsRoutes;
