import Stripe from 'stripe';
import { supabase } from '../db/client';
import { BILLING_CONFIG } from './config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ─────────────────────────────────────────────────────
// reportUsage — nach jeder Nutzungseinheit aufrufen
// Generalisiert: funktioniert für Minuten, Calls, Tokens
// ─────────────────────────────────────────────────────
export async function reportUsage(
  userId: string,
  units: number,
  metadata?: Record<string, string>
) {
  // 1. Supabase loggen
  await supabase.from('usage_logs').insert({
    user_id:    userId,
    units,
    metadata,
    created_at: new Date().toISOString(),
  });

  // 2. Stripe Metered Billing reporten
  const { stripe_item_id } = await getSubscriptionItem(userId);
  await stripe.subscriptionItems.createUsageRecord(stripe_item_id, {
    quantity:  units,
    action:    'increment',
    timestamp: Math.floor(Date.now() / 1000),
  });
}

// ─────────────────────────────────────────────────────
// checkFreeTier — vor jeder Session prüfen
// ─────────────────────────────────────────────────────
export async function checkFreeTier(userId: string): Promise<{
  hasFreeTier: boolean;
  remaining:   number;
}> {
  const { data } = await supabase
    .from('users')
    .select('free_tier_used, free_tier_remaining')
    .eq('id', userId)
    .single();

  return {
    hasFreeTier: !data?.free_tier_used,
    remaining:   data?.free_tier_remaining ?? BILLING_CONFIG.freeTierUnits,
  };
}

async function getSubscriptionItem(userId: string) {
  const { data } = await supabase
    .from('subscriptions')
    .select('stripe_item_id')
    .eq('user_id', userId)
    .single();
  if (!data?.stripe_item_id) throw new Error('No subscription found');
  return data;
}
