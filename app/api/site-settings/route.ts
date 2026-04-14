import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * GET /api/site-settings
 * Public endpoint — returns non-sensitive site settings (before/after images, etc.)
 */
export async function GET() {
  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await db
    .from('site_settings')
    .select('key, value')
    .in('key', ['before_image_url', 'after_image_url', 'before_after_enabled']);

  if (error) {
    console.error('[site-settings] DB error:', error.message);
    return NextResponse.json({ settings: {} });
  }

  const settings: Record<string, string | null> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}
