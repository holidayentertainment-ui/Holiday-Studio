-- ─────────────────────────────────────────────────────────────
-- Migration 002 — Make user_id nullable + add email-based RLS
-- Run this AFTER 001_purchases.sql if you already ran that one
-- If you haven't run 001 yet, run BOTH in order
-- ─────────────────────────────────────────────────────────────

-- Make user_id nullable so webhook can store purchase even if
-- the Stripe email doesn't match a Supabase account yet
ALTER TABLE public.purchases
  ALTER COLUMN user_id DROP NOT NULL;

-- Add email-based RLS policy so users can see purchases
-- that were recorded by email before their account was linked
CREATE POLICY "users_read_own_purchases_by_email"
  ON public.purchases
  FOR SELECT
  USING (user_email = (auth.jwt() ->> 'email'));
