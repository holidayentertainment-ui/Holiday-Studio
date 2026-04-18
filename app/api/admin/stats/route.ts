import { NextResponse } from 'next/server';
import { getAdminUser, getServiceClient } from '@/lib/admin-auth';

/**
 * GET /api/admin/stats
 * Returns user & subscription analytics for the admin dashboard.
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  // ── Fetch all auth users ──────────────────────────────────────────────────
  const { data: usersData, error: usersError } = await db.auth.admin.listUsers({
    perPage: 10000,
  });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

  const allUsers = usersData?.users ?? [];

  // ── Fetch all completed purchases ─────────────────────────────────────────
  const { data: purchasesData, error: purchasesError } = await db
    .from('purchases')
    .select('user_id, purchased_at')
    .eq('status', 'completed');
  if (purchasesError) {
    return NextResponse.json({ error: purchasesError.message }, { status: 500 });
  }

  const allPurchases = purchasesData ?? [];

  // ── Date helpers ──────────────────────────────────────────────────────────
  // "Today" = start of current UTC day
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  // Build last-7-days labels: ["Mon 14", "Tue 15", ...] ending today
  const days: { label: string; dateStr: string; start: Date; end: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setUTCDate(d.getUTCDate() - i);
    const end = new Date(d);
    end.setUTCDate(end.getUTCDate() + 1);

    const label = d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    const dateStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"

    days.push({ label, dateStr, start: d, end });
  }

  // ── Scalar counts ─────────────────────────────────────────────────────────
  const totalUsers = allUsers.length;

  const todayUsers = allUsers.filter((u) => {
    const created = new Date(u.created_at);
    return created >= todayStart;
  }).length;

  // Unique subscribed users (distinct user_id)
  const subscribedUserIds = new Set(allPurchases.map((p) => p.user_id));
  const totalSubscribed = subscribedUserIds.size;

  const todaySubscriptions = allPurchases.filter((p) => {
    const purchased = new Date(p.purchased_at);
    return purchased >= todayStart;
  }).length;

  // ── 7-day breakdowns ──────────────────────────────────────────────────────
  const weeklyUsers = days.map(({ label, start, end }) => ({
    label,
    count: allUsers.filter((u) => {
      const created = new Date(u.created_at);
      return created >= start && created < end;
    }).length,
  }));

  const weeklySubscriptions = days.map(({ label, start, end }) => ({
    label,
    count: allPurchases.filter((p) => {
      const purchased = new Date(p.purchased_at);
      return purchased >= start && purchased < end;
    }).length,
  }));

  return NextResponse.json({
    totalUsers,
    todayUsers,
    totalSubscribed,
    todaySubscriptions,
    weeklyUsers,
    weeklySubscriptions,
  });
}
