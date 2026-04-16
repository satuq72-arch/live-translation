// packages/core/auth/clerk.ts
// ✅ Wiederverwendbar — für jede SaaS

import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '../db/client';

// ─────────────────────────────────────────────
// Server-seitig: aktuellen User aus Supabase holen
// ─────────────────────────────────────────────
export async function getUser() {
  const { userId } = auth();
  if (!userId) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  return data;
}

// ─────────────────────────────────────────────
// Webhook: neuen User in Supabase anlegen
// Wird von Clerk aufgerufen wenn sich jemand registriert
// ─────────────────────────────────────────────
export async function createUserFromClerk(clerkUserId: string, email: string) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      clerk_id:            clerkUserId,
      email,
      plan:                'usage-based',
      free_tier_used:      false,
      free_tier_remaining: 30,  // = BILLING_CONFIG.freeTierUnits
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
