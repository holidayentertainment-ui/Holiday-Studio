import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, getServiceClient } from '@/lib/admin-auth';

/**
 * POST /api/admin/users/[userId]/credits
 * Gives free credits to a user and creates a notification.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { credits, note, userEmail } = body;

  if (!credits || typeof credits !== 'number' || credits < 1) {
    return NextResponse.json({ error: 'Credits must be a positive number.' }, { status: 400 });
  }
  if (!userEmail?.trim()) {
    return NextResponse.json({ error: 'User email is required.' }, { status: 400 });
  }

  const db = getServiceClient();

  // Insert credit record
  const { error: creditError } = await db.from('user_credits').insert({
    user_id: params.userId,
    user_email: userEmail.trim().toLowerCase(),
    credits,
    note: note?.trim() || null,
    granted_by: admin.email,
  });

  if (creditError) return NextResponse.json({ error: creditError.message }, { status: 500 });

  // Create notification for the user
  const creditLabel = credits === 1 ? '1 free credit' : `${credits} free credits`;
  const notifMessage = note?.trim()
    ? `You've received ${creditLabel}! Note: ${note.trim()}`
    : `You've received ${creditLabel} to use on Holiday Focus Studio.`;

  await db.from('notifications').insert({
    user_id: params.userId,
    user_email: userEmail.trim().toLowerCase(),
    title: `🎁 You received ${creditLabel}!`,
    message: notifMessage,
    type: 'success',
  });

  return NextResponse.json({ success: true, credits });
}
