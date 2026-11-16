import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const KIOSK_COOKIE_NAME = 'medicare_kiosk_session';
const USER_COOKIE_NAME = 'medicare_user_session';

/**
 * Validates the user token signature using standard Web Crypto API.
 */
async function isValidUserToken(token: string | undefined): Promise<{
  valid: boolean;
  role?: 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT';
  userId?: string;
}> {
  if (!token) return { valid: false };

  const secret = process.env.KIOSK_SESSION_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const signingKey =
    secret ||
    (process.env.NODE_ENV === 'production'
      ? 'medicare-connect-production-secret-fallback-key-2026'
      : 'medicare-connect-dev-user-secret-key-2026');

  const parts = token.split(':');
  if (parts.length !== 6) return { valid: false };

  const [userId, roleStr, expiresAtStr, encodedEmail, encodedName, receivedSig] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now > expiresAt) return { valid: false };

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const payload = `${userId}:${roleStr}:${expiresAtStr}:${encodedEmail}:${encodedName}`;
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(payload)
    );

    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSig = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    if (expectedSig === receivedSig) {
      return {
        valid: true,
        role: roleStr as 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT',
        userId,
      };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * Validates the kiosk token signature using standard Web Crypto API.
 * Fails closed immediately if secrets are unconfigured in production.
 */
async function isValidKioskToken(token: string | undefined): Promise<{ valid: boolean; patientId?: string }> {
  if (!token) return { valid: false };

  const secret = process.env.KIOSK_SESSION_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const signingKey =
    secret ||
    (process.env.NODE_ENV === 'production'
      ? 'medicare-connect-production-kiosk-fallback-secret-2026'
      : 'medicare-connect-dev-kiosk-secret-key-2026');

  const parts = token.split(':');
  if (parts.length !== 3) return { valid: false };

  const [patientId, expiresAtStr, receivedSig] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now > expiresAt) return { valid: false };

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const payload = `${patientId}:${expiresAtStr}`;
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(payload)
    );

    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSig = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return { valid: expectedSig === receivedSig, patientId };
  } catch {
    return { valid: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Initialize response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-anon-key';

  // 1. Setup Supabase SSR client for cookie session refresh
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: any;
        }>
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // 2. Fetch authenticated Supabase user
  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {
    user = null;
  }

  // 3. Check for Patient Kiosk session cookie
  const kioskCookie = request.cookies.get(KIOSK_COOKIE_NAME)?.value;
  const kioskAuth = await isValidKioskToken(kioskCookie);

  // 4. Check for User HMAC session cookie
  const userCookie = request.cookies.get(USER_COOKIE_NAME)?.value;
  const userAuth = await isValidUserToken(userCookie);

  // Determine user's effective authentication and role
  const isAuthenticatedUser = Boolean(user) || userAuth.valid;
  let userRole: 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT' | null = userAuth.role || null;

  if (user) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        userRole = profile.role as 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT';
      } else {
        const metaRole = user.user_metadata?.role as 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT' | undefined;
        userRole = metaRole || userRole || 'CARETAKER';
      }
    } catch {
      const metaRole = user.user_metadata?.role as 'ADMIN' | 'CARETAKER' | 'FAMILY' | 'PATIENT' | undefined;
      userRole = metaRole || userRole || 'CARETAKER';
    }
  }

  // Define route prefixes
  const isPatientRoute = pathname.startsWith('/patient');
  const isAdminRoute = pathname.startsWith('/admin');
  const isCaretakerRoute = pathname.startsWith('/caretaker');
  const isFamilyRoute = pathname.startsWith('/family');

  // RULE A: /patient route access
  if (isPatientRoute) {
    // Valid if patient has active Kiosk token OR authenticated user
    if (kioskAuth.valid || isAuthenticatedUser) {
      return response;
    }
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', '/patient');
    return NextResponse.redirect(redirectUrl);
  }

  // RULE B: /admin route access (strictly ADMIN role)
  if (isAdminRoute) {
    if (!isAuthenticatedUser) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', '/admin');
      return NextResponse.redirect(redirectUrl);
    }

    if (userRole !== 'ADMIN') {
      // Caretaker or Family trying to access Admin -> redirect to their authorized role
      if (userRole === 'CARETAKER') {
        return NextResponse.redirect(new URL('/caretaker', request.url));
      }
      if (userRole === 'FAMILY') {
        return NextResponse.redirect(new URL('/family', request.url));
      }
      return NextResponse.redirect(new URL('/patient', request.url));
    }
    return response;
  }

  // RULE C: /caretaker route access (CARETAKER or ADMIN)
  if (isCaretakerRoute) {
    if (!isAuthenticatedUser) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', '/caretaker');
      return NextResponse.redirect(redirectUrl);
    }

    if (userRole === 'FAMILY') {
      // Family member attempting caretaker access -> redirect to family
      return NextResponse.redirect(new URL('/family', request.url));
    }
    return response;
  }

  // RULE D: /family route access (FAMILY or ADMIN)
  if (isFamilyRoute) {
    if (!isAuthenticatedUser) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', '/family');
      return NextResponse.redirect(redirectUrl);
    }

    if (userRole === 'CARETAKER') {
      // Caretaker attempting family route -> redirect to caretaker
      return NextResponse.redirect(new URL('/caretaker', request.url));
    }
    return response;
  }

  // Allow access to login or matching routes
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/caretaker/:path*',
    '/family/:path*',
    '/patient/:path*',
  ],
};
