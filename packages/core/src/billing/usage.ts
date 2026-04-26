import Stripe from 'stripe';
import { supabase } from '../db/client';
import { BILLING_CONFIG } from './config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function canUseService(clerkUserId: string): Promise<{
  allowed:  boolean;
  reason?:  'BILLING_LIMIT' | 'USER_NOT_FOUND';
}> {
  const { data: user } = await supabase
    .from('users')
    .select('id, free_tier_used, free_tier_remaining')
    .eq('clerk_id', clerkUserId)
    .single();

  if (!user) return { allowed: false, reason: 'USER_NOT_FOUND' };

  if (!user.free_tier_used && user.free_tier_remaining > 0) {
    return { allowed: true };
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (sub) return { allowed: true };

  return { allowed: false, reason: 'BILLING_LIMIT' };
}

export async function reportUsage(
  clerkUserId: string,
  units:       number,
  metadata?:   Record<string, string>
) {
  if (units <= 0) return;

  const { data: user } = await supabase
    .from('users')
    .select('id, free_tier_used, free_tier_remaining')
    .eq('clerk_id', clerkUserId)
    .single();

  if (!user) throw new Error('User not found');

  await supabase.from('usage_logs').insert({
    user_id:    user.id,
    session_id: metadata?.session_id ?? '',
    units,
    metadata,
    created_at: new Date().toISOString(),
  });

  if (!user.free_tier_used && user.free_tier_remaining > 0) {
    const newRemaining = Math.max(0, user.free_tier_remaining - Math.ceil(units));
    await supabase
      .from('users')
      .update({ free_tier_remaining: newRemaining, free_tier_used: newRemaining <= 0 })
      .eq('id', user.id);
  } else {
    const { stripe_item_id } = await getSubscriptionItem(user.id);
    await stripe.subscriptionItems.createUsageRecord(stripe_item_id, {
      quantity:  Math.ceil(units),
      action:    'increment',
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
}

async function getSubscriptionItem(userUuid: string) {
  const { data } = await supabase
    .from('subscriptions')
    .select('stripe_item_id')
    .eq('user_id', userUuid)
    .eq('status', 'active')
    .single();

  if (!data?.stripe_item_id) throw new Error('No active subscription found');
  return data;
}
