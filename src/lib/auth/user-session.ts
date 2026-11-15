import crypto from 'crypto';
import { cookies } from 'next/headers';
import { UserRole } from '@/types';

export const USER_COOKIE_NAME = 'medicare_user_session';
const SESSION_TTL_SECONDS = 86400; // 24 hours

function getSigningSecret(): string {
  const secret = process.env.KIOSK_SESSION_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return 'medicare-connect-production-secret-fallback-key-2026';
    }
    return 'medicare-connect-dev-user-secret-key-2026';
  }
  return secret;
}

function signPayload(payload: string): string {
  return crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('hex');
}

export interface UserSessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

/**
 * Creates a cryptographically signed HMAC token for authenticated user sessions.
 */
export function createUserSessionToken(user: UserSessionPayload, ttlSeconds: number = SESSION_TTL_SECONDS): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const encodedName = Buffer.from(user.name, 'utf-8').toString('base64url');
  const encodedEmail = Buffer.from(user.email, 'utf-8').toString('base64url');
  const payload = `${user.userId}:${user.role}:${expiresAt}:${encodedEmail}:${encodedName}`;
  const signature = signPayload(payload);
  return `${payload}:${signature}`;
}

/**
 * Verifies the HMAC-SHA256 signature and expiration of a user session token.
 */
export function verifyUserSessionToken(token: string | undefined | null): {
  valid: boolean;
  user?: UserSessionPayload;
  error?: string;
} {
  if (!token) {
    return { valid: false, error: 'No user session token provided' };
  }

  const parts = token.split(':');
  if (parts.length !== 6) {
    return { valid: false, error: 'Malformed user session token' };
  }

  const [userId, roleStr, expiresAtStr, encodedEmail, encodedName, receivedSig] = parts;
  const payload = `${userId}:${roleStr}:${expiresAtStr}:${encodedEmail}:${encodedName}`;
  const expectedSig = signPayload(payload);

  const receivedBuf = Buffer.from(receivedSig, 'utf-8');
  const expectedBuf = Buffer.from(expectedSig, 'utf-8');
  if (receivedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  const expiresAt = parseInt(expiresAtStr, 10);
  if (Math.floor(Date.now() / 1000) > expiresAt) {
    return { valid: false, error: 'User session has expired' };
  }

  try {
    const email = Buffer.from(encodedEmail, 'base64url').toString('utf-8');
    const name = Buffer.from(encodedName, 'base64url').toString('utf-8');
    return {
      valid: true,
      user: {
        userId,
        email,
        role: roleStr as UserRole,
        name,
      },
    };
  } catch {
    return { valid: false, error: 'Failed to decode session metadata' };
  }
}

/**
 * Sets the signed HTTP-only user session cookie.
 */
export async function setUserSessionCookie(user: UserSessionPayload): Promise<void> {
  const cookieStore = await cookies();
  const token = createUserSessionToken(user);
  cookieStore.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

/**
 * Retrieves and validates the current user session from cookies.
 */
export async function getUserSession(): Promise<{
  authenticated: boolean;
  user?: UserSessionPayload;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_COOKIE_NAME)?.value;
    const verified = verifyUserSessionToken(token);
    if (verified.valid && verified.user) {
      return { authenticated: true, user: verified.user };
    }
  } catch {
    // Non-blocking
  }
  return { authenticated: false };
}

/**
 * Clears the user session cookie on logout.
 */
export async function clearUserSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
}
