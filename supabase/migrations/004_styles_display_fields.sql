-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Add display fields to styles, is_active to user_roles
-- ─────────────────────────────────────────────────────────────────────────────

-- ── styles: add icon, blurb, mood ──────────────────────────────────────────
ALTER TABLE styles ADD COLUMN IF NOT EXISTS icon  TEXT NOT NULL DEFAULT '🖼️';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS blurb TEXT NOT NULL DEFAULT '';
ALTER TABLE styles ADD COLUMN IF NOT EXISTS mood  TEXT NOT NULL DEFAULT '';

-- ── user_roles: add is_active ───────────────────────────────────────────────
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ── Back-fill icon / blurb / mood for the 7 seeded styles ─────────────────
UPDATE styles SET
  icon  = '👤',
  blurb = 'Clean, studio-quality portrait with neutral background and soft lighting.',
  mood  = 'Corporate · LinkedIn · Clean'
WHERE title = 'Professional Headshot';

UPDATE styles SET
  icon  = '📸',
  blurb = 'Simple, accurate casting-style with true identity and body proportions.',
  mood  = 'Casting · Agency · Minimal'
WHERE title = 'Model Casting';

UPDATE styles SET
  icon  = '🖼️',
  blurb = 'Mid-torso to head editorial portrait with fashion-forward presence.',
  mood  = 'Fashion · Editorial · Modern'
WHERE title = 'Quarter Editorial';

UPDATE styles SET
  icon  = '✦',
  blurb = 'Elevated full-body editorial with premium styling and strong composition.',
  mood  = 'Vogue · Magazine · Premium'
WHERE title = 'Full Editorial';

UPDATE styles SET
  icon  = '💎',
  blurb = 'Intimate close-up with flawless skin, editorial makeup, and luxury feel.',
  mood  = 'Beauty · Glam · Close-up'
WHERE title = 'Beauty Editorial';

UPDATE styles SET
  icon  = '👑',
  blurb = 'Campaign-ready luxury fashion energy with bold styling and drama.',
  mood  = 'Campaign · Luxury · Bold'
WHERE title = 'High Fashion';

UPDATE styles SET
  icon  = '🎬',
  blurb = 'Dramatic moody lighting with cinematic color and clear subject separation.',
  mood  = 'Film · Moody · Cinematic'
WHERE title = 'Cinematic Portrait';
