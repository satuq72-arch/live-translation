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

    // Buffer messages that arrive before async auth is complete.
    // Without this, the client's 'start' message is lost while the server
    // is still awaiting verifyToken / canUseService.
    const pendingMessages: Buffer[] = [];
    let handleMsg: ((msg: Buffer) => void) | null = null;

    socket.on('message', (msg: Buffer) => {
      if (handleMsg) {
        handleMsg(msg);
      } else {
        pendingMessages.push(msg);
      }
    });

    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const token = (req.query as any).token as string | undefined;
    if (!token) {
      socket.send(JSON.stringify({ type: 'error', code: 'AUTH_ERROR', message: 'Missing token' } satisfies WSErrorEvent));
      socket.close(1008, 'Unauthorized');
      return;
    }

    let userId: string;
    try {
      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
      userId = payload.sub;
    } catch (e: any) {
      socket.send(JSON.stringify({ type: 'error', code: 'AUTH_ERROR', message: 'Invalid token' } satisfies WSErrorEvent));
      socket.close(1008, 'Unauthorized');
      return;
    }

    // ── 2. Fetch email for lazy user creation ────────────────────────────────
    let email: string | undefined;
    try {
      const clerkUser = await clerk.users.getUser(userId);
      email = clerkUser.emailAddresses[0]?.emailAddress;
    } catch { /* non-critical */ }

    // ── 3. Billing ───────────────────────────────────────────────────────────
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

    // ── 4. Session state ─────────────────────────────────────────────────────
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
        if (sid) { await handleAudio.stop(sid); sessionManager.remove(sid); }
        if (t)   await t.stop();
      } catch (err) {
        app.log.error({ err }, 'cleanup error');
      }
    }

    // ── 5. Register real message handler, then drain buffered messages ───────
    handleMsg = async (msg: Buffer) => {
      let event: any = null;
      if (msg[0] === 123 || msg[0] === 91) {
        try { event = JSON.parse(msg.toString()); } catch { /* binary */ }
      }

      if (event) {
        if (event.type === 'start') {
          if (sessionId) return;
          if (!event.sessionId) {
            socket.send(JSON.stringify({ type: 'error', code: 'AUTH_ERROR', message: 'Missing sessionId' } satisfies WSErrorEvent));
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
            socket.send(JSON.stringify({ type: 'error', code: 'DEEPGRAM_ERROR', message: err.message } satisfies WSErrorEvent));
          }
        }

        if (event.type === 'stop') {
          await cleanup();
        }
      } else {
        if (sessionId) handleAudio.sendAudio(sessionId, msg);
      }
    };

    // Drain any messages that arrived during async auth
    for (const msg of pendingMessages) handleMsg(msg);

    socket.on('close', () => cleanup());
  });
};

export default wsRoutes;
