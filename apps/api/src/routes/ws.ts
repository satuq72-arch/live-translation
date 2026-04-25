// apps/api/src/routes/ws.ts
import type { FastifyPluginAsync } from 'fastify';
import { getAuth } from '@clerk/fastify';
import { sessionManager } from '@saas/core/ws-gateway/server';
import { UsageTracker }   from '@saas/core/usage/tracker';
import { checkFreeTier }  from '@saas/core/billing/usage';
import { handleAudio }    from '../services/deepgram';
import type { WSErrorEvent } from '@saas/shared';

const wsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/translate', { websocket: true }, async (socket, req) => {

    // 1. Auth
    const { userId } = getAuth(req);
    if (!userId) {
      socket.close(1008, 'Unauthorized');
      return;
    }

    // 2. Free Tier prüfen und durchsetzen
    const { hasFreeTier, remaining } = await checkFreeTier(userId);
    if (!hasFreeTier || remaining <= 0) {
      const err: WSErrorEvent = { type: 'error', code: 'BILLING_LIMIT', message: 'Dein Free-Tier-Kontingent ist aufgebraucht.' };
      socket.send(JSON.stringify(err));
      socket.close(1000, 'Billing limit');
      return;
    }

    let sessionId: string | null = null;
    let tracker: UsageTracker | null = null;

    socket.on('message', async (msg: Buffer) => {
      const isJSON = msg[0] === 123; // '{'

      if (isJSON) {
        let event: any;
        try { event = JSON.parse(msg.toString()); } catch { return; }

        if (event.type === 'start') {
          // sessionId vom Frontend übernehmen
          sessionId = event.sessionId ?? crypto.randomUUID();
          tracker   = new UsageTracker(userId, sessionId);
          sessionManager.add(userId, sessionId!, socket as any);

          try {
            await handleAudio.start(userId, sessionId!, event, (result) => {
              sessionManager.send(sessionId!, result);
              if ((result as any).type === 'final') {
                tracker!.tick(((result as any).duration ?? 0) / 60);
              }
            });
          } catch (err: any) {
            const wsErr: WSErrorEvent = { type: 'error', code: 'DEEPGRAM_ERROR', message: err.message };
            socket.send(JSON.stringify(wsErr));
          }
        }

        if (event.type === 'stop' && sessionId) {
          await handleAudio.stop(userId);
          await tracker?.stop();
          sessionManager.remove(sessionId);
          sessionId = null;
        }

      } else {
        // Binary PCM Audio → Deepgram
        handleAudio.sendAudio(userId, msg);
      }
    });

    socket.on('close', async () => {
      await handleAudio.stop(userId);
      await tracker?.stop();
      if (sessionId) sessionManager.remove(sessionId);
    });
  });
};

export default wsRoutes;
