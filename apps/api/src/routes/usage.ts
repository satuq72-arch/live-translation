import type { FastifyPluginAsync } from 'fastify';

// Usage API — wird in Schritt 5 implementiert
const usageRoutes: FastifyPluginAsync = async (app) => {
  app.get('/current', async (req) => {
    // TODO: Schritt 5 — Supabase usage_logs abfragen
    return { unitsUsed: 0, estimatedCost: 0 };
  });
};

export default usageRoutes;
