-- ─────────────────────────────────────────────────────────────
-- Holiday Focus Studio — Purchase History Table
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.purchases (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email       text        NOT NULL,
  stripe_session_id text       NOT NULL UNIQUE,   -- stored server-side only, never exposed to client
  amount_cents     integer     NOT NULL,           -- e.g. 1499 = $14.99
  currency         text        NOT NULL DEFAULT 'usd',
  plan_name        text        NOT NULL DEFAULT 'Premium',
  status           text        NOT NULL DEFAULT 'completed',
  purchased_at     timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON public.purchases (user_id);
CREATE INDEX IF NOT EXISTS purchases_user_email_idx ON public.purchases (user_email);

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can only read their own purchase records
CREATE POLICY "users_read_own_purchases"
  ON public.purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts are only done by the server webhook via service_role key (bypasses RLS)
-- No INSERT policy needed for regular users

-- ── View for safe client-facing data (hides stripe_session_id) ────────────
CREATE OR REPLACE VIEW public.purchase_history AS
  SELECT
    id,
    user_id,
    user_email,
    amount_cents,
    currency,
    plan_name,
    status,
    purchased_at
  FROM public.purchases;

-- Grant access on the view
GRANT SELECT ON public.purchase_history TO authenticated;
