'use server';

import {
  signInWithEmail,
  signInDemoRole,
  signOutUser,
  acceptUserInvitation,
  SignInResult,
  UserRole,
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
 * Server Action for instant one-click demo role exploration
 */
export async function signInDemoRoleAction(role: UserRole): Promise<SignInResult> {
  return signInDemoRole(role);
}

/**
 * Server Action for patient numeric PIN kiosk authentication
 */
export async function verifyPinAction(patientId: string, pin: string): Promise<PinAuthResult> {
  return verifyKioskPin(patientId, pin);
}

/**
 * Server Action for user registration and sign-up
 */
export async function acceptInviteAction(formData: {
  email: string;
  password: string;
  fullName: string;
  role: 'CARETAKER' | 'FAMILY' | 'ADMIN' | 'PATIENT';
  pin?: string;
}): Promise<SignInResult> {
  return acceptUserInvitation(formData);
}

/**
 * Server Action for signing out
 */
export async function signOutAction(): Promise<void> {
  await signOutUser();
}
