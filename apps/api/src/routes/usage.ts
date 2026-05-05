import type { FastifyPluginAsync } from 'fastify';
import { getAuth } from '@clerk/fastify';
import { requireAuth } from '../middleware/auth';
import { supabase } from '@saas/core/db/client';
import { BILLING_CONFIG } from '@saas/core/billing/config';

const usageRoutes: FastifyPluginAsync = async (app) => {

  app.get('/current', { preHandler: requireAuth }, async (req) => {
    const { userId } = getAuth(req);

    const { data: user } = await supabase
      .from('users')
      .select('id, free_tier_remaining, free_tier_used')
      .eq('clerk_id', userId!)
      .single();

    if (!user) return { unitsUsed: 0, remaining: BILLING_CONFIG.freeTierUnits, estimatedCost: 0 };

    const { data: logs } = await supabase
      .from('usage_logs')
      .select('units')
      .eq('user_id', user.id);

    const unitsUsed = logs?.reduce((sum, l) => sum + Number(l.units), 0) ?? 0;
    const estimatedCost = unitsUsed * BILLING_CONFIG.unitPrice;

    return {
      unitsUsed,
      remaining: user.free_tier_remaining,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
    };
  });

  app.get('/billing-status', { preHandler: requireAuth }, async (req) => {
    const { userId } = getAuth(req);

    const { data: user } = await supabase
      .from('users')
      .select('id, free_tier_remaining, free_tier_used')
      .eq('clerk_id', userId!)
      .single();

    if (!user) {
      return {
        freeTierRemaining: BILLING_CONFIG.freeTierUnits,
        freeTierUsed:      false,
        isSubscribed:      false,
        unitsUsed:         0,
        estimatedCost:     0,
      };
    }

    const [{ data: sub }, { data: logs }] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single(),
      supabase
        .from('usage_logs')
        .select('units')
        .eq('user_id', user.id),
    ]);

    const unitsUsed = logs?.reduce((sum, l) => sum + Number(l.units), 0) ?? 0;

    return {
      freeTierRemaining: user.free_tier_remaining,
      freeTierUsed:      user.free_tier_used,
      isSubscribed:      !!sub,
      periodEnd:         sub?.current_period_end ?? null,
      unitsUsed:         Math.round(unitsUsed * 10) / 10,
      estimatedCost:     Math.round(unitsUsed * BILLING_CONFIG.unitPrice * 100) / 100,
    };
  });
};

export default usageRoutes;
