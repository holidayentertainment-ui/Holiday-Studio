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
    console.error('[webhook] Missing env vars:', {
      hasStripeKey: !!stripeSecretKey,
      hasWebhookSecret: !!webhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
    });
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
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

  console.log('[webhook] Event received:', event.type);

  // ── Handle checkout.session.completed ────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log('[webhook] Session:', {
      id: session.id,
      amount: session.amount_total,
      currency: session.currency,
      client_reference_id: session.client_reference_id,
      customer_email: session.customer_email,
      customer_details_email: session.customer_details?.email,
    });

    const customerEmail =
      session.customer_email ??
      session.customer_details?.email ??
      null;

    // ── Use service role to bypass RLS ──────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── Find user — client_reference_id first, email fallback ───────────
    // client_reference_id = Supabase user.id, set when the user clicks Upgrade
    // This works even if they type a different email in the Stripe form
    let userId: string | null = null;

    const clientRefId = session.client_reference_id ?? null;

    if (clientRefId) {
      // Primary: direct lookup by Supabase user ID — 100% reliable
      try {
        const { data: { user }, error } = await supabase.auth.admin.getUserById(clientRefId);
        if (error || !user) {
          console.warn('[webhook] getUserById failed:', error?.message);
        } else {
          userId = user.id;
          console.log('[webhook] Matched user by client_reference_id:', user.email, 'id:', user.id);
        }
      } catch (e) {
        console.warn('[webhook] getUserById threw:', e);
      }
    }

    if (!userId && customerEmail) {
      // Fallback: match by email (covers old purchases or missing client_reference_id)
      try {
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (usersError) {
          console.warn('[webhook] listUsers failed:', usersError.message);
        } else {
          const matched = users.find(
            (u) => u.email?.toLowerCase() === customerEmail.toLowerCase(),
          );
          if (matched) {
            userId = matched.id;
            console.log('[webhook] Matched user by email fallback:', matched.email);
          } else {
            console.warn('[webhook] No user found by email either:', customerEmail);
          }
        }
      } catch (e) {
        console.warn('[webhook] Email fallback lookup failed:', e);
      }
    }

    if (!userId && !customerEmail) {
      console.error('[webhook] No client_reference_id and no customer email — cannot record purchase');
      return NextResponse.json({ received: true });
    }

    // ── Insert purchase record — always saved regardless of user match ──
    const { error: insertError } = await supabase.from('purchases').insert({
      user_id:           userId,                          // null if no match — that's OK
      user_email:        customerEmail,
      stripe_session_id: session.id,                     // stored server-side only
      amount_cents:      session.amount_total ?? 1499,
      currency:          session.currency ?? 'usd',
      plan_name:         'Premium',
      status:            'completed',
      purchased_at:      new Date().toISOString(),
    });

    if (insertError) {
      if (insertError.code === '23505') {
        // Duplicate — Stripe retried the same event
        console.log('[webhook] Duplicate event ignored for session:', session.id);
      } else {
        console.error('[webhook] Insert error:', insertError);
        return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
      }
    } else {
      console.log('[webhook] ✓ Purchase saved — email:', customerEmail, 'user_id:', userId ?? 'null (email-only)');

      // ── Send purchase notification to the user ──────────────────────
      if (userId || customerEmail) {
        const amountFormatted = session.amount_total
          ? `$${(session.amount_total / 100).toFixed(2)}`
          : '';
        try {
          await supabase.from('notifications').insert({
            user_id: userId,
            user_email: customerEmail?.toLowerCase() ?? null,
            title: '🎉 Premium Unlocked!',
            message: `Your Premium plan is now active${amountFormatted ? ` (${amountFormatted})` : ''}. All styles — including Full Editorial, High Fashion, and Cinematic Portrait — are now available.`,
            type: 'success',
          });
          console.log('[webhook] ✓ Purchase notification sent');
        } catch (e) {
          console.warn('[webhook] Notification insert failed:', e);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
