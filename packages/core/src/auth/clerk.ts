import { auth } from '@clerk/nextjs/server';
import { supabase } from '../db/client';

export async function getUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  return data;
}

export async function createUserFromClerk(clerkUserId: string, email: string) {
  // Upsert so repeated webhook deliveries and lazy-creation don't conflict
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        clerk_id:            clerkUserId,
        email,
        plan:                'usage-based',
        free_tier_used:      false,
        free_tier_remaining: 30,
      },
      { onConflict: 'clerk_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
