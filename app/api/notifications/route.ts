import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * GET /api/notifications
 * Returns notifications for the currently logged-in user.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ notifications: [] });

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await db
    .from('notifications')
    .select('*')
    .or(`user_id.eq.${user.id},user_email.eq.${user.email?.toLowerCase()}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ notifications: [] });

  return NextResponse.json({ notifications: data ?? [] });
}

/**
 * PATCH /api/notifications
 * Marks notifications as read.
 * Body: { ids: string[] } — array of notification IDs to mark read,
 *       or omit ids to mark ALL as read.
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { ids } = body as { ids?: string[] };

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let query = db
    .from('notifications')
    .update({ is_read: true })
    .or(`user_id.eq.${user.id},user_email.eq.${user.email?.toLowerCase()}`);

  if (ids?.length) {
    query = query.in('id', ids);
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
