// apps/api/src/routes/ws.ts — Schritt 4: WS Gateway
import type { FastifyPluginAsync } from 'fastify';
import { sessionManager } from '@saas/core/ws-gateway/server';
import { UsageTracker }   from '@saas/core/usage/tracker';
import { checkFreeTier }  from '@saas/core/billing/usage';
import { handleAudio }    from '../services/deepgram';

const wsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/translate', { websocket: true }, async (socket, req) => {

    // 1. Auth prüfen
    const userId = (req as any).auth?.userId;
    if (!userId) { socket.close(1008, 'Unauthorized'); return; }

    // 2. Free Tier prüfen
    const { hasFreeTier, remaining } = await checkFreeTier(userId);
    const sessionId = crypto.randomUUID();
    const tracker   = new UsageTracker(userId, sessionId);

    // 3. Session registrieren
    sessionManager.add(userId, sessionId, socket as any);

    // 4. Nachrichten verarbeiten
    socket.on('message', async (msg: Buffer) => {
      const isJSON = msg[0] === 123; // '{'

      if (isJSON) {
        const event = JSON.parse(msg.toString());

        if (event.type === 'start') {
          // Deepgram Verbindung starten (Schritt 6)
          await handleAudio.start(userId, sessionId, event, (result) => {
            sessionManager.send(userId, result);
            if (result.type === 'final') tracker.tick(result.duration / 60);
          });
        }

        if (event.type === 'stop') {
          await handleAudio.stop(userId);
          await tracker.stop();
          sessionManager.remove(userId);
        }

      } else {
        // Binary: PCM Audio → direkt an Deepgram
        handleAudio.sendAudio(userId, msg);
      }
    });

    socket.on('close', async () => {
      await handleAudio.stop(userId);
      await tracker.stop();
      sessionManager.remove(userId);
    });
  });
};

export default wsRoutes;
