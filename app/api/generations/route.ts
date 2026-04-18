import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const BUCKET = 'generated-images';

// Allow larger request bodies for base64-encoded images (up to ~8MB decoded)
export const maxDuration = 30;

// ── Ensure the storage bucket exists (idempotent) ─────────────────────────

async function ensureBucket(service: ReturnType<typeof createServiceClient>) {
  const { error } = await service.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 12 * 1024 * 1024, // 12 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
  // "already exists" is not a real error — ignore it
  if (error && !error.message.toLowerCase().includes('already exists')) {
    console.warn('[generations] bucket create warning:', error.message);
  }
}

// ── POST /api/generations ─────────────────────────────────────────────────
// Body: { imageBase64, styleId, styleName?, poseId?, location?, wardrobe? }
// Uploads the generated image to Supabase Storage and saves a DB record.

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    imageBase64,
    styleId,
    styleName,
    poseId = 'female',
    location,
    wardrobe,
  } = body as {
    imageBase64: string;
    styleId: string;
    styleName?: string;
    poseId?: string;
    location?: string;
    wardrobe?: string;
  };

  if (!imageBase64 || !styleId) {
    return NextResponse.json(
      { error: 'Missing required fields: imageBase64, styleId' },
      { status: 400 },
    );
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  await ensureBucket(service);

  // Strip data-URL prefix if present and decode to Buffer
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;
  const buffer = Buffer.from(base64Data, 'base64');

  const imageId = crypto.randomUUID();
  const imagePath = `${user.id}/${imageId}.jpg`;

  // Upload image to storage
  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(imagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    console.error('[generations] storage upload error:', uploadError);
    return NextResponse.json(
      { error: 'Failed to upload image to storage' },
      { status: 500 },
    );
  }

  // Save metadata record to DB
  const { data: record, error: dbError } = await service
    .from('generated_images')
    .insert({
      id: imageId,
      user_id: user.id,
      style_id: styleId,
      style_name: styleName || styleId,
      pose_id: poseId,
      image_path: imagePath,
      location: location || null,
      wardrobe: wardrobe || null,
    })
    .select('id, created_at')
    .single();

  if (dbError) {
    // Clean up orphaned storage file
    await service.storage.from(BUCKET).remove([imagePath]);
    console.error('[generations] db insert error:', dbError);
    return NextResponse.json(
      { error: 'Failed to save generation record' },
      { status: 500 },
    );
  }

  console.log(`[generations] saved image id=${record.id} user=${user.id}`);
  return NextResponse.json({ id: record.id }, { status: 201 });
}

// ── GET /api/generations ──────────────────────────────────────────────────
// Query params: limit (max 50, default 20), offset (default 0)
// Returns generation records with short-lived signed image URLs.

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const { data: records, error } = await service
    .from('generated_images')
    .select('id, style_id, style_name, pose_id, image_path, location, wardrobe, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[generations] fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate 2-hour signed URLs for each image
  const images = await Promise.all(
    (records ?? []).map(async (rec) => {
      const { data: signed } = await service.storage
        .from(BUCKET)
        .createSignedUrl(rec.image_path, 7200); // 2 hours

      return {
        id: rec.id,
        styleId: rec.style_id,
        styleName: rec.style_name,
        poseId: rec.pose_id,
        location: rec.location,
        wardrobe: rec.wardrobe,
        createdAt: rec.created_at,
        imageUrl: signed?.signedUrl ?? null,
      };
    }),
  );

  return NextResponse.json({ images });
}

// ── DELETE /api/generations?id=uuid ──────────────────────────────────────
// Removes image from Storage and deletes the DB record.

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Verify ownership before deleting
  const { data: record } = await service
    .from('generated_images')
    .select('image_path, user_id')
    .eq('id', id)
    .single();

  if (!record || record.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Remove from storage first
  await service.storage.from(BUCKET).remove([record.image_path]);

  // Remove DB record
  await service.from('generated_images').delete().eq('id', id);

  console.log(`[generations] deleted image id=${id} user=${user.id}`);
  return NextResponse.json({ success: true });
}
