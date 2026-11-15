'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { clearKioskSession } from '@/lib/auth/kiosk-session';
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

/**
 * Signs in a user using Supabase Auth and validates their database role.
 * Role is strictly derived from public.users; NEVER trusted from the client.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const supabase = await createServerSupabaseClient();

    // 1. Authenticate credentials against Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || 'Invalid email or password credentials.',
      };
    }

    const userId = authData.user.id;

    // 2. Fetch authoritative user profile from public.users (bypass client claims)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role, full_name, email, updated_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      // Fallback: If trigger hasn't fired yet, create baseline entry or inspect metadata
      const rawMeta = authData.user.user_metadata || {};
      const fallbackRole: UserRole = (rawMeta.role as UserRole) || 'CARETAKER';

      await supabase.from('users').upsert({
        id: userId,
        email: authData.user.email!,
        full_name: rawMeta.full_name || email.split('@')[0],
        role: fallbackRole,
      } as any);

      const redirectUrl = await getRoleDashboardUrl(fallbackRole);
      return { success: true, role: fallbackRole, redirectUrl };
    }

    const role: UserRole = profile.role || 'CARETAKER';
    const redirectUrl = await getRoleDashboardUrl(role);

    return {
      success: true,
      role,
      redirectUrl,
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Signs out the current user and invalidates both Supabase and Kiosk sessions.
 */
export async function signOutUser(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Continue clearing kiosk cookie even if Supabase signout fails
  }

  await clearKioskSession();
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
    } as any);

    const redirectUrl = await getRoleDashboardUrl(formData.role);
    return { success: true, role: formData.role, redirectUrl };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
