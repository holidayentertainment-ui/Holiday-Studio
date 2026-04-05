import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, getServiceClient } from '@/lib/admin-auth';

/**
 * GET /api/admin/styles
 * Returns all styles (including inactive) for admin management.
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data, error } = await db
    .from('styles')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ styles: data });
}

/**
 * POST /api/admin/styles
 * Creates a new style.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, prompt, is_premium, is_active, sort_order, thumbnail_url } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from('styles')
    .insert({
      title: title.trim(),
      prompt: (prompt ?? '').trim(),
      is_premium: Boolean(is_premium),
      is_active: is_active !== false,
      sort_order: Number(sort_order ?? 0),
      thumbnail_url: thumbnail_url?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ style: data }, { status: 201 });
}
