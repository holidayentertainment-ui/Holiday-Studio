import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Never cache this route — style visibility changes must reflect immediately
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/styles
 * Public endpoint — returns all active styles ordered by sort_order.
 * Used by the main website's StyleSelection component.
 */
export async function GET() {
  try {
    const db = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await db
      .from('styles')
      .select('id, title, blurb, icon, mood, is_premium, sort_order, thumbnail_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ styles: data ?? [] });
  } catch (err) {
    console.error('[api/styles] error:', err);
    return NextResponse.json({ styles: [] });
  }
}
