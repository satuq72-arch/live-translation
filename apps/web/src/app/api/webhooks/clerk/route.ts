import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createUserFromClerk } from '@saas/core/auth/clerk';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) throw new Error('Missing CLERK_WEBHOOK_SECRET');

  const headerPayload = headers();
  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: any;

  try {
    event = wh.verify(body, {
      'svix-id':        headerPayload.get('svix-id')!,
      'svix-timestamp': headerPayload.get('svix-timestamp')!,
      'svix-signature': headerPayload.get('svix-signature')!,
    });
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'user.created') {
    const { id, email_addresses } = event.data;
    await createUserFromClerk(id, email_addresses[0]?.email_address);
  }

  return new Response('OK', { status: 200 });
}
