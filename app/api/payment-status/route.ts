import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ── Payment status endpoint ────────────────────────────────────────────────
// Returns hasPremium flag + purchase history for the logged-in user
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
  const supabase = createClient();

  // Confirm the user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<PaymentStatusResponse>({ hasPremium: false, purchases: [] });
  }

  // Fetch completed purchases for this user — stripe_session_id is excluded
  const { data: purchases, error: dbError } = await supabase
    .from('purchases')
    .select('id, plan_name, amount_cents, currency, purchased_at, status')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('purchased_at', { ascending: false });

  if (dbError) {
    console.error('[payment-status] DB error:', dbError);
    return NextResponse.json<PaymentStatusResponse>({ hasPremium: false, purchases: [] });
  }

  const hasPremium = (purchases?.length ?? 0) > 0;

  return NextResponse.json<PaymentStatusResponse>({
    hasPremium,
    purchases: purchases ?? [],
  });
}
