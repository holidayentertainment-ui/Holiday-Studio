import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ── Stripe webhook handler ─────────────────────────────────────────────────
// Listens for: checkout.session.completed
// Records purchase in Supabase and marks user as premium
// ──────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Validate environment ──────────────────────────────────────────────
  const stripeSecretKey    = process.env.STRIPE_SECRET_KEY;
  const webhookSecret      = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('[webhook] Missing required environment variables');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 },
    );
  }

  // ── Read raw body for Stripe signature verification ───────────────────
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // ── Verify Stripe signature ───────────────────────────────────────────
  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── Handle checkout.session.completed ────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const customerEmail =
      session.customer_email ??
      session.customer_details?.email ??
      null;

    if (!customerEmail) {
      console.error('[webhook] No customer email in session:', session.id);
      // Return 200 so Stripe doesn't keep retrying — log this for manual follow-up
      return NextResponse.json({ received: true });
    }

    // ── Use service role to bypass RLS ──────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Find the matching user by email ────────────────────────────────
    // Using listUsers — efficient for small user bases
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('[webhook] Error fetching users:', usersError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const matchedUser = users.find(
      (u) => u.email?.toLowerCase() === customerEmail.toLowerCase(),
    );

    if (!matchedUser) {
      // User paid before creating an account — log for manual linking
      console.warn('[webhook] No user account found for email:', customerEmail);
      return NextResponse.json({ received: true });
    }

    // ── Insert purchase record ──────────────────────────────────────────
    const { error: insertError } = await supabase.from('purchases').insert({
      user_id:          matchedUser.id,
      user_email:       customerEmail,
      stripe_session_id: session.id,                    // stored server-side only
      amount_cents:     session.amount_total ?? 1499,
      currency:         session.currency ?? 'usd',
      plan_name:        'Premium',
      status:           'completed',
      purchased_at:     new Date().toISOString(),
    });

    if (insertError) {
      // Ignore unique constraint violations (Stripe retries same event)
      if (insertError.code === '23505') {
        console.log('[webhook] Duplicate event ignored for session:', session.id);
      } else {
        console.error('[webhook] Insert error:', insertError);
        return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
      }
    } else {
      console.log('[webhook] Purchase recorded — user:', customerEmail, 'session:', session.id);
    }
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}
