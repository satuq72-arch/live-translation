import type { FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';
import { getAuth } from '@clerk/fastify';
import { requireAuth } from '../middleware/auth';
import { supabase } from '@saas/core/db/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function planTypeFromSub(sub: Stripe.Subscription): 'monthly-flat' | 'usage-based' {
  return sub.items.data[0]?.price.id === process.env.STRIPE_MONTHLY_PRICE_ID
    ? 'monthly-flat'
    : 'usage-based';
}

const stripeRoutes: FastifyPluginAsync = async (app) => {

  // ── Stripe Webhook ────────────────────────────────────────────────────────
  app.post('/webhook', async (req, reply) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody as string,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch {
      return reply.status(400).send('Invalid signature');
    }

    switch (event.type) {

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single();

        if (user) {
          await supabase.from('subscriptions').upsert(
            {
              user_id:            user.id,
              stripe_sub_id:      sub.id,
              stripe_item_id:     sub.items.data[0].id,
              plan_type:          planTypeFromSub(sub),
              status:             sub.status,
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            },
            { onConflict: 'stripe_sub_id' }
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_sub_id', invoice.subscription as string);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_sub_id', invoice.subscription as string);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_sub_id', sub.id);
        break;
      }
    }

    reply.send({ received: true });
  });

  // ── Shared helper: get or create Stripe customer ──────────────────────────
  async function getOrCreateCustomer(userId: string) {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('clerk_id', userId)
      .single();

    if (!user) return null;

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    return { user, customerId };
  }

  // ── Create Checkout — usage-based (€0.05 / min) ───────────────────────────
  app.post('/create-checkout', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = getAuth(req);
    const result = await getOrCreateCustomer(userId!);
    if (!result) return reply.status(404).send({ error: 'User not found' });

    const origin = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      customer:    result.customerId,
      mode:        'subscription',
      line_items:  [{ price: process.env.STRIPE_USAGE_PRICE_ID! }],
      success_url: `${origin}/dashboard/billing?success=true`,
      cancel_url:  `${origin}/dashboard/billing`,
    });

    return { url: session.url };
  });

  // ── Create Checkout — monthly flat (€9 / month) ───────────────────────────
  app.post('/create-checkout-monthly', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = getAuth(req);
    const result = await getOrCreateCustomer(userId!);
    if (!result) return reply.status(404).send({ error: 'User not found' });

    const origin = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      customer:    result.customerId,
      mode:        'subscription',
      line_items:  [{ price: process.env.STRIPE_MONTHLY_PRICE_ID! }],
      success_url: `${origin}/dashboard/billing?success=true`,
      cancel_url:  `${origin}/dashboard/billing`,
    });

    return { url: session.url };
  });

  // ── Create Customer Portal Session ────────────────────────────────────────
  app.post('/create-portal', { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = getAuth(req);

    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('clerk_id', userId!)
      .single();

    if (!user?.stripe_customer_id) {
      return reply.status(400).send({ error: 'No Stripe customer found' });
    }

    const origin = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const portal = await stripe.billingPortal.sessions.create({
      customer:   user.stripe_customer_id,
      return_url: `${origin}/dashboard/billing`,
    });

    return { url: portal.url };
  });
};

export default stripeRoutes;
