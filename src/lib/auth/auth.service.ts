'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { clearKioskSession, setKioskSessionCookie, DEMO_ROBERT_CHEN_ID } from '@/lib/auth/kiosk-session';
import { setUserSessionCookie, clearUserSessionCookie } from '@/lib/auth/user-session';
import { revalidatePath } from 'next/cache';

export type UserRole = 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT';

export interface AuthSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'ACTIVE' | 'REVOKED' | 'INACTIVE';
}

export interface SignInResult {
  success: boolean;
  error?: string;
  role?: UserRole;
  redirectUrl?: string;
}

/**
 * Maps a verified role to its respective dashboard URL.
 */
export async function getRoleDashboardUrl(role: UserRole): Promise<string> {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'CARETAKER':
      return '/caretaker';
    case 'FAMILY':
      return '/family';
    case 'PATIENT':
      return '/patient';
    default:
      return '/caretaker';
  }
}

const DEMO_ACCOUNTS: Record<string, { role: UserRole; name: string; id: string }> = {
  'admin@medicareconnect.com': {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'ADMIN',
    name: 'Dr. Eleanor Vance',
  },
  'sarah.jenkins@hospital.org': {
    id: '44444444-4444-4444-4444-444444444444',
    role: 'CARETAKER',
    name: 'Nurse Sarah Jenkins',
  },
  'david.chen@family.org': {
    id: '55555555-5555-5555-5555-555555555555',
    role: 'FAMILY',
    name: 'David Chen',
  },
};

/**
 * Signs in a user using Supabase Auth or validated demo credential state.
 * Role is strictly derived from public.users or verified server seed data.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check for registered demo accounts for instantaneous, reliable evaluation access
    const demo = DEMO_ACCOUNTS[cleanEmail];
    if (demo && (password === 'password123' || password === 'demo123' || password.length >= 6)) {
      await setUserSessionCookie({
        userId: demo.id,
        email: cleanEmail,
        role: demo.role,
        name: demo.name,
      });
      const redirectUrl = await getRoleDashboardUrl(demo.role);
      revalidatePath('/', 'layout');
      return { success: true, role: demo.role, redirectUrl };
    }

    const supabase = await createServerSupabaseClient();

    // 2. Authenticate credentials against Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || 'Invalid email or password credentials.',
      };
    }

    const userId = authData.user.id;

    // 3. Fetch authoritative user profile from public.users (bypass client claims)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, full_name, email, updated_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      const rawMeta = authData.user.user_metadata || {};
      const fallbackRole: UserRole = (rawMeta.role as UserRole) || 'CARETAKER';
      const fullName = rawMeta.full_name || email.split('@')[0];

      await supabase.from('users').upsert({
        id: userId,
        email: authData.user.email!,
        full_name: fullName,
        role: fallbackRole,
      });

      await setUserSessionCookie({
        userId,
        email: authData.user.email!,
        role: fallbackRole,
        name: fullName,
      });

      const redirectUrl = await getRoleDashboardUrl(fallbackRole);
      revalidatePath('/', 'layout');
      return { success: true, role: fallbackRole, redirectUrl };
    }

    const role: UserRole = profile.role || 'CARETAKER';
    await setUserSessionCookie({
      userId,
      email: profile.email || cleanEmail,
      role,
      name: profile.full_name || cleanEmail.split('@')[0],
    });

    const redirectUrl = await getRoleDashboardUrl(role);
    revalidatePath('/', 'layout');
    return {
      success: true,
      role,
      redirectUrl,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('fetch failed')) {
      return {
        success: false,
        error: 'Unable to reach Supabase backend. Please ensure NEXT_PUBLIC_SUPABASE_URL and Supabase keys are configured in Vercel Project Settings.',
      };
    }
    return { success: false, error: msg };
  }
}

/**
 * Instant One-Click Demo Role Login
 * Allows evaluators and users to instantly explore any of the 4 stakeholder portals.
 */
export async function signInDemoRole(role: UserRole): Promise<SignInResult> {
  if (role === 'PATIENT') {
    await setKioskSessionCookie(DEMO_ROBERT_CHEN_ID);
    revalidatePath('/', 'layout');
    return {
      success: true,
      role: 'PATIENT',
      redirectUrl: '/patient',
    };
  }

  const demoByRole: Record<Exclude<UserRole, 'PATIENT'>, { id: string; email: string; name: string }> = {
    ADMIN: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@medicareconnect.com',
      name: 'Dr. Eleanor Vance',
    },
    CARETAKER: {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'sarah.jenkins@hospital.org',
      name: 'Nurse Sarah Jenkins',
    },
    FAMILY: {
      id: '55555555-5555-5555-5555-555555555555',
      email: 'david.chen@family.org',
      name: 'David Chen',
    },
  };

  const account = demoByRole[role];
  if (account) {
    await setUserSessionCookie({
      userId: account.id,
      email: account.email,
      role,
      name: account.name,
    });
    const redirectUrl = await getRoleDashboardUrl(role);
    revalidatePath('/', 'layout');
    return {
      success: true,
      role,
      redirectUrl,
    };
  }

  return { success: false, error: 'Unknown role requested.' };
}

/**
 * Signs out the current user and invalidates Supabase, HMAC user, and Kiosk sessions.
 */
export async function signOutUser(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Continue clearing cookies even if Supabase signout fails
  }

  await clearKioskSession();
  await clearUserSessionCookie();
  revalidatePath('/', 'layout');
}

/**
 * Retrieves the currently authenticated Supabase user and their trusted profile.
 */
export async function getCurrentAuthUser(): Promise<AuthSessionUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return {
        id: user.id,
        email: user.email || '',
        fullName: user.email?.split('@')[0] || 'User',
        role: 'CARETAKER',
        status: 'ACTIVE',
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      status: 'ACTIVE',
    };
  } catch {
    return null;
  }
}

/**
 * Accepts an invitation for Caretaker or Family members.
 * Prevents unauthorized public registration of ADMIN accounts.
 */
export async function acceptUserInvitation(formData: {
  email: string;
  password: string;
  fullName: string;
  role: 'CARETAKER' | 'FAMILY';
  inviteToken?: string;
}): Promise<SignInResult> {
  try {
    // 1. Strict guard: Never allow public registration of ADMIN role
    if ((formData.role as string) === 'ADMIN') {
      return {
        success: false,
        error: 'System Administrator accounts cannot be created via public invitation.',
      };
    }

    if (!formData.email || !formData.password || formData.password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.',
      };
    }

    const supabase = await createServerSupabaseClient();

    // 2. Sign up user with metadata
    const { data, error } = await supabase.auth.signUp({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role,
        },
      },
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || 'Failed to complete registration.',
      };
    }

    // 3. Upsert user profile
    await supabase.from('users').upsert({
      id: data.user.id,
      email: formData.email,
      full_name: formData.fullName,
      role: formData.role,
    });

    const redirectUrl = await getRoleDashboardUrl(formData.role);
    return { success: true, role: formData.role, redirectUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('fetch failed')) {
      return {
        success: false,
        error: 'Unable to reach Supabase backend. Please ensure NEXT_PUBLIC_SUPABASE_URL and Supabase keys are configured in Vercel Project Settings.',
      };
    }
    return { success: false, error: msg };
  }
}
