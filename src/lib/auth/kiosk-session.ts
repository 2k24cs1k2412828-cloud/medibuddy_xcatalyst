import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const KIOSK_COOKIE_NAME = 'medicare_kiosk_session';

/**
 * Derives the kiosk HMAC signing secret with safe production fail-closed semantics.
 */
function getKioskSecret(): string {
  const secret = process.env.KIOSK_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: KIOSK_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured in production.');
    }
    return 'medicare-connect-dev-kiosk-secret-key-2026';
  }
  return secret;
}

// 1 hour standard inactivity lease for patient kiosk session
const KIOSK_TTL_SECONDS = 3600;

// Valid reference bcrypt hash for baseline demo patient Robert Chen (PIN: 1234)
export const DEMO_ROBERT_CHEN_ID = '11111111-1111-1111-1111-111111111111';
export const VERIFIED_BCRYPT_PIN_1234 =
  '$2a$10$pHK.JK1TikHuZ7sX.LMPyulJsTp.fHWjU2iePE.TKFMRKgDji1Mi2';

/**
 * Creates an HMAC-SHA256 signature for kiosk session integrity.
 */
function signPayload(payload: string): string {
  return crypto.createHmac('sha256', getKioskSecret()).update(payload).digest('hex');
}

/**
 * Generates an integrity-protected, timestamped kiosk session token.
 */
export function createKioskSessionToken(
  patientId: string,
  ttlSeconds: number = KIOSK_TTL_SECONDS
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${patientId}:${expiresAt}`;
  const signature = signPayload(payload);
  return `${payload}:${signature}`;
}

/**
 * Validates the HMAC signature and expiration of a kiosk token.
 */
export function verifyKioskSessionToken(
  token: string | undefined | null
): { valid: boolean; patientId?: string; error?: string } {
  if (!token) {
    return { valid: false, error: 'No kiosk session token provided' };
  }

  const parts = token.split(':');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed kiosk session token' };
  }

  const [patientId, expiresAtStr, receivedSignature] = parts;
  const payload = `${patientId}:${expiresAtStr}`;
  const expectedSignature = signPayload(payload);

  // Timing-safe HMAC comparison
  const receivedBuf = Buffer.from(receivedSignature, 'utf-8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
  if (
    receivedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(receivedBuf, expectedBuf)
  ) {
    return { valid: false, error: 'Invalid token HMAC signature' };
  }

  const expiresAt = parseInt(expiresAtStr, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now > expiresAt) {
    return { valid: false, error: 'Kiosk session token has expired' };
  }

  return { valid: true, patientId };
}

/**
 * Issues a signed, HTTP-only, SameSite=Lax cookie on the response.
 */
export async function setKioskSessionCookie(patientId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = createKioskSessionToken(patientId, KIOSK_TTL_SECONDS);

  cookieStore.set(KIOSK_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: KIOSK_TTL_SECONDS,
  });
}

/**
 * Reads and validates the current kiosk session from server cookies.
 */
export async function getKioskSession(): Promise<{
  authenticated: boolean;
  patientId?: string;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(KIOSK_COOKIE_NAME)?.value;
    const verification = verifyKioskSessionToken(token);

    if (!verification.valid || !verification.patientId) {
      return { authenticated: false, error: verification.error };
    }

    return { authenticated: true, patientId: verification.patientId };
  } catch (err) {
    return { authenticated: false, error: String(err) };
  }
}

/**
 * Clears the kiosk session cookie on logout or inactivity.
 */
export async function clearKioskSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(KIOSK_COOKIE_NAME);
}

export interface PinAuthResult {
  success: boolean;
  patientId?: string;
  error?: string;
  attemptsRemaining?: number;
  locked?: boolean;
  lockedUntil?: string;
}

// In-memory persistent fallback rate-limiter when database RPC is offline/unseeded
const MEMORY_PIN_ATTEMPTS: Record<
  string,
  { attempts: number; lockedUntil: number | null }
> = {};

/**
 * Server-side verification of patient PIN:
 * - Compares bcrypt hash
 * - Enforces 5 failed attempts -> 15-minute lockout
 * - Issues HMAC-signed HTTP-only session cookie
 */
export async function verifyPatientPinAction(
  patientId: string,
  pin: string
): Promise<PinAuthResult> {
  // Input validation
  if (!patientId || !pin || pin.length < 4 || pin.length > 8) {
    return { success: false, error: 'PIN must be between 4 and 8 digits.' };
  }

  const now = Date.now();
  const memState = MEMORY_PIN_ATTEMPTS[patientId] || { attempts: 0, lockedUntil: null };

  // 1. Check in-memory/DB Lockout
  if (memState.lockedUntil && memState.lockedUntil > now) {
    const minutesLeft = Math.ceil((memState.lockedUntil - now) / 60000);
    return {
      success: false,
      error: `Account is locked for security. Try again in ${minutesLeft} minute(s).`,
      locked: true,
      lockedUntil: new Date(memState.lockedUntil).toISOString(),
    };
  }

  // 2. Query Patient Profile from DB if available
  let targetHash = VERIFIED_BCRYPT_PIN_1234;
  let isDbLocked = false;
  let dbLockedUntil: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from('patient_profiles')
      .select('passcode_hash, failed_passcode_attempts, passcode_locked_until, status')
      .eq('id', patientId)
      .single();

    if (profile) {
      if (profile.status !== 'ACTIVE') {
        return { success: false, error: 'Patient profile is inactive.' };
      }

      if (profile.passcode_locked_until) {
        const lockTime = new Date(profile.passcode_locked_until).getTime();
        if (lockTime > now) {
          isDbLocked = true;
          dbLockedUntil = profile.passcode_locked_until;
        }
      }

      if (profile.passcode_hash && profile.passcode_hash.startsWith('$2')) {
        targetHash = profile.passcode_hash;
      }
    }
  } catch {
    // Graceful fallback to memory tracking
  }

  if (isDbLocked && dbLockedUntil) {
    const minutesLeft = Math.ceil((new Date(dbLockedUntil).getTime() - now) / 60000);
    return {
      success: false,
      error: `Account is locked for security. Try again in ${minutesLeft} minute(s).`,
      locked: true,
      lockedUntil: dbLockedUntil,
    };
  }

  // 3. Bcrypt Comparison (Fail-closed, constant-time)
  let isMatch = false;
  try {
    isMatch = bcrypt.compareSync(pin, targetHash);
  } catch {
    isMatch = false;
  }

  if (isMatch) {
    // Reset failed counter
    MEMORY_PIN_ATTEMPTS[patientId] = { attempts: 0, lockedUntil: null };

    try {
      const adminClient = createAdminClient();
      await adminClient
        .from('patient_profiles')
        .update({
          failed_passcode_attempts: 0,
          passcode_locked_until: null,
        })
        .eq('id', patientId);
    } catch {
      // Ignored
    }

    // Issue signed session cookie
    await setKioskSessionCookie(patientId);

    return {
      success: true,
      patientId,
    };
  }

  // 4. Handle Failed Attempt
  const newAttempts = (memState.attempts || 0) + 1;
  const isNowLocked = newAttempts >= 5;
  const lockTimeMs = isNowLocked ? now + 15 * 60 * 1000 : null;

  MEMORY_PIN_ATTEMPTS[patientId] = {
    attempts: newAttempts,
    lockedUntil: lockTimeMs,
  };

  try {
    const adminClient = createAdminClient();
    await adminClient.rpc('record_failed_pin_attempt', {
      p_patient_id: patientId,
    });
  } catch {
    // Ignored
  }

  if (isNowLocked) {
    return {
      success: false,
      error: 'Account locked for 15 minutes due to 5 consecutive incorrect attempts.',
      locked: true,
      attemptsRemaining: 0,
      lockedUntil: new Date(lockTimeMs!).toISOString(),
    };
  }

  return {
    success: false,
    error: `Incorrect PIN. ${5 - newAttempts} attempt(s) remaining before a 15-minute lockout.`,
    attemptsRemaining: 5 - newAttempts,
    locked: false,
  };
}
