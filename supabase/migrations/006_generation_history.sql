-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006: generated_images
-- Stores metadata for every AI-generated image per user.
-- Actual image files live in Supabase Storage bucket: generated-images
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS generated_images (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  style_id    TEXT        NOT NULL,
  style_name  TEXT,                   -- human-readable label (e.g. "Professional Headshot")
  pose_id     TEXT        NOT NULL DEFAULT 'female',
  image_path  TEXT        NOT NULL,   -- Storage path: {user_id}/{uuid}.jpg
  location    TEXT,                   -- optional location override
  wardrobe    TEXT,                   -- optional wardrobe override
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS generated_images_user_id_idx
  ON generated_images (user_id);

CREATE INDEX IF NOT EXISTS generated_images_user_created_idx
  ON generated_images (user_id, created_at DESC);

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Users can only read their own generated image records
CREATE POLICY "users_read_own_generated_images"
  ON generated_images FOR SELECT
  USING (user_id = auth.uid());

-- Users can delete their own generated image records
CREATE POLICY "users_delete_own_generated_images"
  ON generated_images FOR DELETE
  USING (user_id = auth.uid());

-- Inserts are performed exclusively via the service role key (API route)
-- No INSERT policy needed for authenticated users.

-- ── NOTE: Supabase Storage ──────────────────────────────────────────────────
-- The bucket "generated-images" is created automatically by the API route
-- on first use (POST /api/generations). No manual bucket setup required.
