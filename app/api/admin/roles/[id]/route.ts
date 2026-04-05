import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, getServiceClient } from '@/lib/admin-auth';

/**
 * PATCH /api/admin/roles/[id]
 * Updates a user_roles entry — supports changing role or toggling is_active.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};

  if ('role' in body) {
    if (!['admin', 'team_member'].includes(body.role)) {
      return NextResponse.json({ error: 'Role must be admin or team_member.' }, { status: 400 });
    }
    updates.role = body.role;
  }

  if ('is_active' in body) {
    updates.is_active = Boolean(body.is_active);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from('user_roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Role entry not found.' }, { status: 404 });

  return NextResponse.json({ role: data });
}

/**
 * DELETE /api/admin/roles/[id]
 * Removes a role entry (revokes access entirely).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getServiceClient();
  const { error } = await db.from('user_roles').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
