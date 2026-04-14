import { NextResponse } from 'next/server';
import { getAdminUser, getServiceClient } from '@/lib/admin-auth';

/**
 * GET /api/admin/users
 * Returns a list of all registered users from Supabase Auth
 * along with their total free credits.
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  // List all auth users (max 1000; paginate if needed)
  const { data: usersData, error: usersError } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  // Fetch total credits per user
  const { data: creditsData } = await db
    .from('user_credits')
    .select('user_email, credits');

  // Sum credits per email
  const creditsByEmail: Record<string, number> = {};
  for (const row of creditsData ?? []) {
    creditsByEmail[row.user_email] = (creditsByEmail[row.user_email] ?? 0) + row.credits;
  }

  const users = (usersData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? '',
    name: (u.user_metadata?.full_name ?? u.user_metadata?.name ?? '') as string,
    avatar_url: (u.user_metadata?.avatar_url ?? '') as string,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    total_credits: creditsByEmail[u.email ?? ''] ?? 0,
  }));

  return NextResponse.json({ users });
}
