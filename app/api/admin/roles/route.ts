import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, getServiceClient } from '@/lib/admin-auth';

/**
 * GET /api/admin/roles
 * Returns all user roles.
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  const { data, error } = await db
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ roles: data });
}

/**
 * POST /api/admin/roles
 * Adds a new role entry for an email address.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { email, role } = body;

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }
  if (!['admin', 'team_member'].includes(role)) {
    return NextResponse.json({ error: 'Role must be admin or team_member.' }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from('user_roles')
    .insert({ email: email.trim().toLowerCase(), role })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This email already has a role assigned.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ role: data }, { status: 201 });
}
