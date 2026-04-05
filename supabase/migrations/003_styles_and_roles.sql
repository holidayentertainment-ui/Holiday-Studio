-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: styles + user_roles tables
-- ─────────────────────────────────────────────────────────────────────────────

-- ── user_roles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL UNIQUE,
  role        TEXT        NOT NULL CHECK (role IN ('admin', 'team_member')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── styles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS styles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  prompt         TEXT        NOT NULL DEFAULT '',
  is_premium     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  thumbnail_url  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at auto-trigger function ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER styles_updated_at
  BEFORE UPDATE ON styles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE styles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Public can read active styles (used by the main website)
CREATE POLICY "public_read_active_styles"
  ON styles FOR SELECT
  USING (is_active = TRUE);

-- All write operations on styles go through service role (admin API)
-- All operations on user_roles go through service role (admin API)
-- No user-level policies needed for those.

-- ── Seed: user roles ────────────────────────────────────────────────────────
INSERT INTO user_roles (email, role) VALUES
  ('holidayentertainment@gmail.com', 'admin'),
  ('arjunsinhhh@gmail.com',          'team_member')
ON CONFLICT (email) DO NOTHING;

-- ── Seed: styles (mirrors the 7 existing hardcoded styles) ─────────────────
INSERT INTO styles (title, prompt, is_premium, is_active, sort_order) VALUES

  ('Professional Headshot',
   'Create one full-frame professional headshot using the uploaded reference photo.

Identity lock:
Keep facial features, expression, and proportions consistent.

Background:
Clean, neutral, professional background (light gray, off-white, or seamless studio).
No textures, no props, no environmental distractions.

Lighting:
Soft, even, casting-style lighting that flatters without glamour.

Skin:
Natural, realistic appearance with light texture and even tone.

Lens feel:
Classic portrait look (85mm).

Mood:
Confident, approachable, professional.',
   FALSE, TRUE, 1),

  ('Model Casting',
   'Create one professional, agency-standard casting basic image using the uploaded reference photo.
Wardrobe: black leotard OR fitted black top with blue jeans.
Hair, makeup, and grooming: natural and minimal.
Lighting: even and neutral.
Background: plain studio or clean wall.
Poses: straightforward and agency-friendly.
Style: clean casting look, no glamour, no drama.
Match body size and proportions exactly to the reference.
Professional model comp preview quality.',
   FALSE, TRUE, 2),

  ('Quarter Editorial',
   'Create one quarter-length editorial portrait (mid-torso to head) using the uploaded reference photo. Identity lock: Identity lock must remain consistent. Background & setting: Editorial environment (studio with texture, architectural space, or clean outdoor fashion setting). Lighting: More directional and stylized than the headshot, but still controlled. Pose: Editorial posture with intention and presence (not casting-neutral). Wardrobe: Fashion-forward but not exaggerated. Lens feel: Standard portrait/editorial look (50mm). Mood: Modern, confident, editorial.',
   FALSE, TRUE, 3),

  ('Full Editorial',
   'MODE: FULL BODY FASHION

Create one full-body fashion image using the uploaded reference photo.

FACE: Use the subject''s exact face from the reference — same features, bone structure, skin tone.
WARDROBE: REPLACE any clothing from the reference entirely. Dress the subject in a clean, modern fashion outfit — tailored trousers with a structured top, or a sleek fashion dress. Professional and portfolio-ready styling. This wardrobe change is mandatory.
POSE: NEW full-body editorial pose — standing with clear weight shift, one hand on hip or arm extended, strong posture with fashion presence. DO NOT copy the reference pose.
BACKGROUND: Keep the reference background or use a simple clean studio or outdoor environment.
LIGHTING: Even professional light with slight directional quality.
LENS FEEL: Fashion full-body 35mm equivalent.

Match body size and proportions exactly to the reference. Professional model comp quality. Hybrid between casting and editorial.',
   TRUE, TRUE, 4),

  ('Beauty Editorial',
   'MODE: GARMENT SHOWCASE

Create a photorealistic fashion model to showcase the garment from the uploaded reference photo.

IMPORTANT: The model must NOT resemble the person in the reference photo. Generate a new generic fashion model.
GARMENT: Recreate the exact garment from the reference — accurate fabric texture, fit, color, drape, and construction details.
MODEL: Fashion-appropriate proportions. Natural realistic skin — visible texture, not hyper-detailed, not smoothed.
POSE: Clean editorial pose that showcases the garment silhouette clearly.
BACKGROUND: Professional studio or clean outdoor light.
LIGHTING: Professional studio or clean outdoor light.
LENS FEEL: Editorial fashion 35mm–50mm equivalent.

Generate a professional fashion preview image suitable for lookbooks or pitch decks. Identity lock does NOT apply — focus is garment accuracy only.',
   TRUE, TRUE, 5),

  ('High Fashion',
   'MODE: FULL BODY EDITORIAL — HIGH FASHION

Create one full-frame professional full-body high-fashion editorial image using the uploaded reference photo.

⚠️ FACE LOCK REMINDER: The face in the output must be 100% identical to the reference photo. Same eyes, nose, lips, jawline, skin tone. Do NOT beautify, idealize, or alter the face in any way. The bold styling and dramatic lighting do NOT justify any face changes.
FACE: Exact copy of the reference face — no alterations whatsoever.
WARDROBE: REPLACE any clothing from the reference completely. Dress the subject in an elevated, exaggerated, fashion-forward outfit — structured avant-garde pieces, bold silhouettes, premium fabric. This is the strongest styling moment. No logos. This wardrobe change is mandatory — the reference outfit must NOT appear.
POSE: NEW high-fashion pose — strong asymmetric stance, arms creating sharp angles, head tilted with attitude. Clear silhouette and strong fashion presence. DO NOT copy the reference pose.
BACKGROUND: Keep the reference background or use a high-fashion environment — minimalist studio, architectural interior, or creative urban location.
LIGHTING: Dramatic fashion lighting — strong key light, defined shadows, premium feel.
LENS FEEL: Fashion full-body 35mm equivalent.
MOOD: Bold, editorial, campaign-ready.

Match body size and proportions exactly to the reference. Campaign-level output. Push styling, keep anatomy real.',
   TRUE, TRUE, 6),

  ('Cinematic Portrait',
   'MODE: FULL BODY DRAMATIC EDITORIAL

Create one full-body dramatic editorial image using the uploaded reference photo.

⚠️ FACE LOCK REMINDER: The face in the output must be 100% identical to the reference photo. Same eyes, nose, lips, jawline, skin tone. Do NOT beautify, idealize, or alter the face in any way. Cinematic lighting and dramatic styling do NOT give permission to change the face.
FACE: Exact copy of the reference face — no alterations whatsoever.
WARDROBE: REPLACE any clothing from the reference completely. Dress the subject in: an editorial premium outfit — structured black coat or long dramatic dress with clean elegant lines. Modern female styling, no logos. This wardrobe change is mandatory.
POSE: NEW dramatic pose — body at an angle, spine elongated, one arm extended holding a classic black umbrella to frame the silhouette. Strong angular lines through the entire body. DO NOT copy the reference pose. This must be a visibly dramatic and different pose.
ACCESSORIES: Classic black umbrella (primary prop, held in hand framing silhouette against light). Pearl necklace. Both must look realistic — correct scale, real material texture, natural hand grip. Anatomically correct hands.
BACKGROUND: Keep the reference background or use a fashion-forward environment with clean negative space.
LIGHTING: Cinematic — strong shape-defining shadows, body line emphasis. No beauty softening.
LENS FEEL: Wide editorial fashion 28–35mm equivalent.

Match body size and proportions exactly to the reference. Highest artistic tier — enforce all constraints aggressively.',
   TRUE, TRUE, 7)

ON CONFLICT DO NOTHING;
