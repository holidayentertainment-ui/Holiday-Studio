import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, getServiceClient } from '@/lib/admin-auth';

/**
 * GET /api/admin/settings
 * Returns all site settings.
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data, error } = await db.from('site_settings').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Convert array of {key,value} to a plain object
  const settings: Record<string, string | null> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}

/**
 * PUT /api/admin/settings
 * Upserts one or more settings.
 * Body: { [key]: value }
 */
export async function PUT(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const db = getServiceClient();
  const rows = Object.entries(body).map(([key, value]) => ({
    key,
    value: value as string | null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await db
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
