// apps/api/src/routes/stripe.ts — Schritt 5
import type { FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';
import { supabase } from '@saas/core/db/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const stripeRoutes: FastifyPluginAsync = async (app) => {

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

      // Rechnung bezahlt → Status updaten
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_sub_id', invoice.subscription as string);
        break;
      }

      // Zahlung fehlgeschlagen → User sperren
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_sub_id', invoice.subscription as string);
        break;
      }

      // Abo erstellt → in Supabase speichern
      case 'customer.subscription.created': {
        const sub  = event.data.object as Stripe.Subscription;
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', sub.customer as string)
          .single();

        if (user) {
          await supabase.from('subscriptions').insert({
            user_id:        user.id,
            stripe_sub_id:  sub.id,
            stripe_item_id: sub.items.data[0].id,
            status:         sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          });
        }
        break;
      }
    }

    reply.send({ received: true });
  });
};

export default stripeRoutes;
