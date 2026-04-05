import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export type AdminRole = 'admin' | 'team_member';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
}

/**
 * Validates the current session and checks if the user has an admin or
 * team_member role in the user_roles table.
 *
 * Returns the AdminUser object on success, or null if the user is not
 * authenticated or does not have a role.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user?.email) return null;

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: roleRow } = await serviceClient
      .from('user_roles')
      .select('role, is_active')
      .eq('email', user.email)
      .single();

    // No role found, or role has been suspended
    if (!roleRow || roleRow.is_active === false) return null;

    return {
      id: user.id,
      email: user.email,
      role: roleRow.role as AdminRole,
    };
  } catch {
    return null;
  }
}

/** Creates a Supabase service-role client (bypasses RLS). */
export function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
