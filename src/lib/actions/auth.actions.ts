'use server';

import {
  signInWithEmail,
  signOutUser,
  acceptUserInvitation,
  SignInResult,
} from '@/lib/auth/auth.service';
import {
  verifyPatientPinAction as verifyKioskPin,
  PinAuthResult,
} from '@/lib/auth/kiosk-session';

/**
 * Server Action for standard email/password authentication
 */
export async function signInAction(email: string, password: string): Promise<SignInResult> {
  return signInWithEmail(email, password);
}

/**
 * Server Action for patient numeric PIN kiosk authentication
 */
export async function verifyPinAction(patientId: string, pin: string): Promise<PinAuthResult> {
  return verifyKioskPin(patientId, pin);
}

/**
 * Server Action for accepting an invitation / user registration
 */
export async function acceptInviteAction(formData: {
  email: string;
  password: string;
  fullName: string;
  role: 'CARETAKER' | 'FAMILY';
}): Promise<SignInResult> {
  return acceptUserInvitation(formData);
}

/**
 * Server Action for signing out
 */
export async function signOutAction(): Promise<void> {
  await signOutUser();
}
