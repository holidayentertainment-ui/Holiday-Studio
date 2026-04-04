import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ── Payment status endpoint ────────────────────────────────────────────────
// Returns hasPremium flag + purchase history for the logged-in user
// Checks by user_id first, then falls back to email match
// Stripe session IDs are never returned — only display-safe fields
// ──────────────────────────────────────────────────────────────────────────

export interface Purchase {
  id: string;
  plan_name: string;
  amount_cents: number;
  currency: string;
  purchased_at: string;
  status: string;
}

export interface PaymentStatusResponse {
  hasPremium: boolean;
  purchases: Purchase[];
}

export async function GET() {
  const supabase = await createClient();

  // Confirm the user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<PaymentStatusResponse>({ hasPremium: false, purchases: [] });
  }

  // Query by user_id OR by email — handles purchases saved before account linking
  const { data: purchases, error: dbError } = await supabase
    .from('purchases')
    .select('id, plan_name, amount_cents, currency, purchased_at, status')
    .or(`user_id.eq.${user.id},user_email.eq.${user.email}`)
    .eq('status', 'completed')
    .order('purchased_at', { ascending: false });

  if (dbError) {
    console.error('[payment-status] DB error:', dbError);
    return NextResponse.json<PaymentStatusResponse>({ hasPremium: false, purchases: [] });
  }

  // De-duplicate in case both user_id and email matched the same row
  const seen = new Set<string>();
  const unique = (purchases ?? []).filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const hasPremium = unique.length > 0;

  return NextResponse.json<PaymentStatusResponse>({
    hasPremium,
    purchases: unique,
  });
}
