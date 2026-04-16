import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createStripeCustomer(email: string, name: string) {
  return stripe.customers.create({ email, name });
}

export async function createUsageSubscription(customerId: string) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_USAGE_PRICE_ID! }],
    billing_cycle_anchor: 'now',
    proration_behavior: 'none',
  });
}

export async function getInvoices(customerId: string) {
  return stripe.invoices.list({ customer: customerId, limit: 24 });
}
