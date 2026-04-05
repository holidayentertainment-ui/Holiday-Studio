import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';

/**
 * GET /api/admin/check
 * Returns the current user's admin role if they have one.
 * Used by the Header to decide whether to show the Admin Panel button.
 */
export async function GET() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return NextResponse.json({ hasAccess: false }, { status: 200 });
  }

  return NextResponse.json({
    hasAccess: true,
    role: adminUser.role,
    email: adminUser.email,
  });
}
