-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 005: user_credits, notifications, site_settings
-- ─────────────────────────────────────────────────────────────────────────────

-- ── user_credits ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_credits (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  user_email  TEXT        NOT NULL,
  credits     INTEGER     NOT NULL DEFAULT 0,
  note        TEXT,
  granted_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_credits_user_id_idx    ON user_credits (user_id);
CREATE INDEX IF NOT EXISTS user_credits_user_email_idx ON user_credits (user_email);

-- ── notifications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  user_email  TEXT,
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'info',
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_user_email_idx ON notifications (user_email);

-- ── site_settings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT        PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE user_credits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings   ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits
CREATE POLICY "users_read_own_credits"
  ON user_credits FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_email = (auth.jwt() ->> 'email')
  );

-- Users can read their own notifications
CREATE POLICY "users_read_own_notifications"
  ON notifications FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_email = (auth.jwt() ->> 'email')
  );

-- Users can mark their own notifications as read
CREATE POLICY "users_update_own_notifications"
  ON notifications FOR UPDATE
  USING (
    user_id = auth.uid()
    OR user_email = (auth.jwt() ->> 'email')
  );

-- Public can read site settings (before/after images, etc.)
CREATE POLICY "public_read_site_settings"
  ON site_settings FOR SELECT
  USING (true);

-- ── Default site settings seed ─────────────────────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('before_image_url', NULL),
  ('after_image_url',  NULL),
  ('before_after_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
