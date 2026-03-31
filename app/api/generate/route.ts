import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// ── Available image generation models ────────────────────────────────────
// Nano Banana (stable)    — fast, cost-efficient, production-ready
const MODEL_NANO_BANANA         = 'gemini-2.5-flash-image';
// Nano Banana 2 (preview) — faster + higher quality, launched Feb 2026
// const MODEL_NANO_BANANA_2    = 'gemini-3.1-flash-image-preview';
// Nano Banana Pro (preview) — best quality, uses Thinking, great for complex prompts
const MODEL_NANO_BANANA_PRO  = 'gemini-3-pro-image-preview';

// Currently active model
const ACTIVE_MODEL = MODEL_NANO_BANANA_PRO;

const PROFESSIONAL_HEADSHOT_PROMPT = `Create one full-frame professional headshot using the uploaded reference photo.

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
Confident, approachable, professional.`;

const QUARTER_EDITORIAL_PROMPT = `Create one quarter-length editorial portrait (mid-torso to head) using the uploaded reference photo. Identity lock: Identity lock must remain consistent. Background & setting: Editorial environment (studio with texture, architectural space, or clean outdoor fashion setting). Lighting: More directional and stylized than the headshot, but still controlled. Pose: Editorial posture with intention and presence (not casting-neutral). Wardrobe: Fashion-forward but not exaggerated. Lens feel: Standard portrait/editorial look (50mm). Mood: Modern, confident, editorial.`;

const MODEL_CASTING_PROMPT = `Create one professional, agency-standard casting basic image using the uploaded reference photo.
Wardrobe: black leotard OR fitted black top with blue jeans.
Hair, makeup, and grooming: natural and minimal.
Lighting: even and neutral.
Background: plain studio or clean wall.
Poses: straightforward and agency-friendly.
Style: clean casting look, no glamour, no drama.
Match body size and proportions exactly to the reference.
Professional model comp preview quality.`;

// ── GLOBAL IDENTITY + QUALITY LOCK (applied to every mode) ───────────────

function buildGlobalLock(): string {
  return `REFERENCE PHOTO USAGE — CRITICAL INSTRUCTIONS:
The uploaded reference photo is used ONLY to extract the following:
  1. The subject's FACE: exact facial features, bone structure, skin tone, eyes, nose, lips, jawline, eye shape, nose shape — copy the face with 100% accuracy
  2. The subject's BODY SHAPE and proportions: height, build, frame

DO NOT copy or replicate the following from the reference photo:
  - DO NOT keep the original outfit or clothing — REPLACE it completely with the wardrobe specified below
  - DO NOT keep the original pose — GENERATE the new pose described below
  - DO NOT keep the original lighting — APPLY the lighting described below

BACKGROUND: The background from the reference photo MAY be kept or used as-is. If a specific background is described below, apply it — otherwise the reference background is acceptable.

⚠️ FACE LOCK — ABSOLUTE PRIORITY — NO EXCEPTIONS:
The subject's face must be identical to the reference photo in every way:
- Same eye shape, eye color, eye spacing — do not alter
- Same nose shape and size — do not alter
- Same lip shape and fullness — do not alter
- Same jawline, cheekbones, and facial structure — do not alter
- Same skin tone and complexion — do not alter
- Same eyebrow shape — do not alter
- NO face warping. NO face reshaping. NO beautification. NO idealization.
- The face must look like the SAME PERSON as in the reference — not a similar person, not a better-looking version — the exact same person.
- This face lock applies with EQUAL force to ALL modes including dramatic, fashion, and editorial modes.
- Changing clothes, pose, or lighting does NOT give permission to alter the face.

GLOBAL QUALITY LOCK — NON-NEGOTIABLE:
- Preserve realistic anatomy: natural body proportions, correct limb length, accurate hands
- NO artificial smoothing, beauty retouching, or skin softening of any kind
- NO distortion, warping, or body reshaping
- NO glamour filtering, glow effects, or dreamy soft-focus blur
- Photorealistic output only — no illustration, no painterly effects
- High-resolution sharp output (4K–8K quality standard)
- Natural skin texture must be visible: pores, realistic tone variation, no plastic appearance
- NO extra fingers, fused fingers, broken wrists, or warped hands
- NO text artifacts, watermarks, or low-quality output`;
}

// ── GLOBAL NEGATIVE CONSTRAINTS (appended last for maximum weight) ────────

function buildNegativeConstraints(): string {
  return `STRICT NEGATIVE CONSTRAINTS — ENFORCE AGGRESSIVELY:
No face distortion. No face alteration. No face idealization. No face beautification. No changing the subject's face from the reference — the face must be identical. No body warping. No extra fingers. No plastic skin. No beauty smoothing. No skin softening. No AI over-retouching. No exaggerated anatomy. No sexualized posing. No influencer aesthetics. No cartoon style. No logos unless specified. No text artifacts. No low-quality output. No warped hands. No fused fingers. No broken wrists. No incorrect grip. No floating props. No melted accessories. No incorrect scale. No dreamy soft-focus. No glow filters. No body reshaping. No glamour diffusion. No making the subject look like a different person.`;
}

// ── MODE-SPECIFIC PROMPT BUILDERS ─────────────────────────────────────────

function buildModePrompt(featureId: string): string {
  const modes: Record<string, string> = {

    // 1. PROFESSIONAL HEADSHOT
    professional_headshot: PROFESSIONAL_HEADSHOT_PROMPT,

    // 2. CASTING BASIC
    model_casting: MODEL_CASTING_PROMPT,

    // 3. QUARTER LENGTH EDITORIAL
    quarter_editorial: QUARTER_EDITORIAL_PROMPT,

    // 4. FULL BODY FASHION
    full_editorial: `MODE: FULL BODY FASHION

Create one full-body fashion image using the uploaded reference photo.

FACE: Use the subject's exact face from the reference — same features, bone structure, skin tone.
WARDROBE: REPLACE any clothing from the reference entirely. Dress the subject in a clean, modern fashion outfit — tailored trousers with a structured top, or a sleek fashion dress. Professional and portfolio-ready styling. This wardrobe change is mandatory.
POSE: NEW full-body editorial pose — standing with clear weight shift, one hand on hip or arm extended, strong posture with fashion presence. DO NOT copy the reference pose.
BACKGROUND: Keep the reference background or use a simple clean studio or outdoor environment.
LIGHTING: Even professional light with slight directional quality.
LENS FEEL: Fashion full-body 35mm equivalent.

Match body size and proportions exactly to the reference. Professional model comp quality. Hybrid between casting and editorial.`,

    // 5. FULL BODY EDITORIAL — HIGH FASHION
    high_fashion: `MODE: FULL BODY EDITORIAL — HIGH FASHION

Create one full-frame professional full-body high-fashion editorial image using the uploaded reference photo.

⚠️ FACE LOCK REMINDER: The face in the output must be 100% identical to the reference photo. Same eyes, nose, lips, jawline, skin tone. Do NOT beautify, idealize, or alter the face in any way. The bold styling and dramatic lighting do NOT justify any face changes.
FACE: Exact copy of the reference face — no alterations whatsoever.
WARDROBE: REPLACE any clothing from the reference completely. Dress the subject in an elevated, exaggerated, fashion-forward outfit — structured avant-garde pieces, bold silhouettes, premium fabric. This is the strongest styling moment. No logos. This wardrobe change is mandatory — the reference outfit must NOT appear.
POSE: NEW high-fashion pose — strong asymmetric stance, arms creating sharp angles, head tilted with attitude. Clear silhouette and strong fashion presence. DO NOT copy the reference pose.
BACKGROUND: Keep the reference background or use a high-fashion environment — minimalist studio, architectural interior, or creative urban location.
LIGHTING: Dramatic fashion lighting — strong key light, defined shadows, premium feel.
LENS FEEL: Fashion full-body 35mm equivalent.
MOOD: Bold, editorial, campaign-ready.

Match body size and proportions exactly to the reference. Campaign-level output. Push styling, keep anatomy real.`,

    // 6. FULL BODY DRAMATIC EDITORIAL
    cinematic_portrait: `MODE: FULL BODY DRAMATIC EDITORIAL

Create one full-body dramatic editorial image using the uploaded reference photo.

⚠️ FACE LOCK REMINDER: The face in the output must be 100% identical to the reference photo. Same eyes, nose, lips, jawline, skin tone. Do NOT beautify, idealize, or alter the face in any way. Cinematic lighting and dramatic styling do NOT give permission to change the face.
FACE: Exact copy of the reference face — no alterations whatsoever.
WARDROBE: REPLACE any clothing from the reference completely. Dress the subject in: an editorial premium outfit — structured black coat or long dramatic dress with clean elegant lines. Modern female styling, no logos. This wardrobe change is mandatory.
POSE: NEW dramatic pose — body at an angle, spine elongated, one arm extended holding a classic black umbrella to frame the silhouette. Strong angular lines through the entire body. DO NOT copy the reference pose. This must be a visibly dramatic and different pose.
ACCESSORIES: Classic black umbrella (primary prop, held in hand framing silhouette against light). Pearl necklace. Both must look realistic — correct scale, real material texture, natural hand grip. Anatomically correct hands.
BACKGROUND: Keep the reference background or use a fashion-forward environment with clean negative space.
LIGHTING: Cinematic — strong shape-defining shadows, body line emphasis. No beauty softening.
LENS FEEL: Wide editorial fashion 28–35mm equivalent.

Match body size and proportions exactly to the reference. Highest artistic tier — enforce all constraints aggressively.`,

    // 7. GARMENT SHOWCASE
    beauty_editorial: `MODE: GARMENT SHOWCASE

Create a photorealistic fashion model to showcase the garment from the uploaded reference photo.

IMPORTANT: The model must NOT resemble the person in the reference photo. Generate a new generic fashion model.
GARMENT: Recreate the exact garment from the reference — accurate fabric texture, fit, color, drape, and construction details.
MODEL: Fashion-appropriate proportions. Natural realistic skin — visible texture, not hyper-detailed, not smoothed.
POSE: Clean editorial pose that showcases the garment silhouette clearly.
BACKGROUND: Professional studio or clean outdoor light.
LIGHTING: Professional studio or clean outdoor light.
LENS FEEL: Editorial fashion 35mm–50mm equivalent.

Generate a professional fashion preview image suitable for lookbooks or pitch decks. Identity lock does NOT apply — focus is garment accuracy only.`,
  };

  return modes[featureId] ?? modes['professional_headshot'];
}

// ── POSE / GENDER STYLING ─────────────────────────────────────────────────

function buildPosePrompt(poseId: string): string {
  const poses: Record<string, string> = {
    female: `GENDER STYLING — FEMALE: Apply Vogue/editorial feminine posing. Elongated neck, weight on one hip, one knee slightly bent, refined hand placement (no fists, no stiff arms). The pose must be clearly different from whatever pose appears in the reference photo.`,
    male: `GENDER STYLING — MALE: Apply GQ-inspired masculine posing. Wide stance, shoulders back, jaw set, arms with controlled angles. Strong and grounded. The pose must be clearly different from whatever pose appears in the reference photo.`,
    non_binary: `GENDER STYLING — NON-BINARY: Apply a blended editorial pose — balanced, intentional, neither strictly feminine nor masculine. Clean lines and strong presence. The pose must be clearly different from whatever pose appears in the reference photo.`,
  };
  return poses[poseId] ?? poses['female'];
}

// ── FINAL PROMPT ASSEMBLY ─────────────────────────────────────────────────

function assemblePrompt(
  featureId: string,
  poseId: string,
  location?: string,
  wardrobe?: string,
): string {
  if (featureId === 'professional_headshot') {
    return PROFESSIONAL_HEADSHOT_PROMPT;
  }

  if (featureId === 'quarter_editorial') {
    return QUARTER_EDITORIAL_PROMPT;
  }

  if (featureId === 'model_casting') {
    return MODEL_CASTING_PROMPT;
  }

  const parts: string[] = [
    buildGlobalLock(),
    buildModePrompt(featureId),
    buildPosePrompt(poseId),
  ];

  if (location?.trim()) {
    parts.push(`Location / Background override: ${location.trim()}.`);
  }
  if (wardrobe?.trim()) {
    parts.push(`Wardrobe / Styling override: ${wardrobe.trim()}.`);
  }

  // Always append negative constraints last so they carry maximum weight
  parts.push(buildNegativeConstraints());

  return parts.join('\n\n');
}

// ── Route handler ─────────────────────────────────────────────────────────

export const maxDuration = 60; // seconds — Next.js serverless function timeout

export async function POST(req: NextRequest) {
  try {
    // ── Validate API key ──
    const apiKey = process.env.gemini_API_KEY;
    if (!apiKey) {
      console.error('[generate] gemini_API_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error: missing API key.' },
        { status: 500 },
      );
    }

    // ── Parse request body ──
    const body = await req.json();
    const {
      featureId,
      poseId = 'female',
      imageBase64,
      mimeType = 'image/jpeg',
      location,
      wardrobe,
    } = body as {
      featureId: string;
      poseId?: string;
      imageBase64: string;
      mimeType?: string;
      location?: string;
      wardrobe?: string;
    };

    if (!featureId || !imageBase64) {
      return NextResponse.json(
        { error: 'Missing required fields: featureId and imageBase64.' },
        { status: 400 },
      );
    }

    // ── Build prompt ──
    const prompt = assemblePrompt(featureId, poseId, location, wardrobe);

    console.log(`[generate] model=${ACTIVE_MODEL} feature=${featureId} pose=${poseId}`);

    // ── Call Gemini API ──
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: ACTIVE_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            // Reference image
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            // Instruction prompt
            { text: prompt },
          ],
        },
      ],
      config: {
        // Request both image and optional descriptive text back
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    // ── Extract the generated image ──
    const parts = response.candidates?.[0]?.content?.parts ?? [];

    const imagePart = parts.find(
      (p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData?.data,
    );

    if (!imagePart?.inlineData?.data) {
      // Log text response for debugging if no image came back
      const textPart = parts.find((p: { text?: string }) => p.text);
      console.error('[generate] No image in response. Text part:', textPart?.text ?? '(none)');
      return NextResponse.json(
        { error: 'The model did not return an image. Please try again.' },
        { status: 502 },
      );
    }

    const { data: imgBase64, mimeType: imgMime = 'image/jpeg' } = imagePart.inlineData;
    const imageUrl = `data:${imgMime};base64,${imgBase64}`;

    console.log(`[generate] success — mime=${imgMime} size≈${Math.round(imgBase64.length / 1024)}KB`);

    return NextResponse.json({ imageUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error.';
    console.error('[generate] error:', err);

    // Surface rate-limit / quota errors clearly
    if (message.includes('429') || message.toLowerCase().includes('quota')) {
      return NextResponse.json(
        { error: 'Gemini API quota exceeded. Please wait a moment and try again.' },
        { status: 429 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
