import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ── Check for first-time sign-in and send a welcome notification ──
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const createdAt = new Date(user.created_at).getTime();
          const now = Date.now();
          const isNewUser = now - createdAt < 120_000; // created within last 2 minutes

          if (isNewUser) {
            const db = createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
            );
            const name = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? '').split(' ')[0];
            await db.from('notifications').insert({
              user_id: user.id,
              user_email: user.email?.toLowerCase(),
              title: `👋 Welcome to Holiday Focus Studio${name ? `, ${name}` : ''}!`,
              message: 'You\'re all set. Upload a photo and generate your first AI studio image — free styles are available right away.',
              type: 'success',
            });
          }
        }
      } catch {
        // Non-blocking — don't let this interrupt the auth flow
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
