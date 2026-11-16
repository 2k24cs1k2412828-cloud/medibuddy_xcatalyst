'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  LogIn,
  Tablet,
} from 'lucide-react';
import {
  signInAction,
  acceptInviteAction,
  verifyPinAction,
} from '@/lib/actions/auth.actions';
import { DEMO_ROBERT_CHEN_ID } from '@/lib/constants';

export function LoginClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authMode, setAuthMode] = useState<'SIGNIN' | 'SIGNUP' | 'PIN'>('SIGNIN');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'CARETAKER' | 'FAMILY' | 'ADMIN' | 'PATIENT'>('CARETAKER');
  const [signupPin, setSignupPin] = useState('1234');
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  // Kiosk PIN Keypad State
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // 1. Real Sign In Submission
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await signInAction(email, password);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
      } else {
        setFormError(res.error || 'Invalid email or password. Please verify your credentials.');
      }
    });
  };

  // 2. Real Sign Up Submission
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await acceptInviteAction({
        email: signupEmail,
        password: signupPassword,
        fullName: signupName,
        role: signupRole,
        pin: signupRole === 'PATIENT' ? signupPin : undefined,
      });

      if (res.success) {
        setSignupSuccess(`Account created! Redirecting to ${signupRole} dashboard...`);
        setTimeout(() => {
          router.push(res.redirectUrl || '/caretaker');
        }, 800);
      } else {
        setFormError(res.error || 'Failed to complete registration.');
      }
    });
  };

  // 3. Tactile Kiosk PIN Keypad
  const handleKeypadPress = (digit: string) => {
    if (isLocked || pin.length >= 4) return;

    const nextPin = pin + digit;
    setPin(nextPin);
    setPinError(null);

    if (nextPin.length === 4) {
      startTransition(async () => {
        const res = await verifyPinAction(DEMO_ROBERT_CHEN_ID, nextPin);
        if (res.success) {
          setPinSuccess(true);
          setTimeout(() => {
            router.push('/patient');
          }, 500);
        } else {
          setPin('');
          setPinError(res.error || 'Incorrect PIN. Please re-enter your 4-digit patient PIN.');
          if (res.locked) {
            setIsLocked(true);
          }
        }
      });
    }
  };

  const handleClearPin = () => {
    if (isLocked) return;
    setPin('');
    setPinError(null);
  };

  const handleBackspacePin = () => {
    if (isLocked) return;
    setPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  return (
    <div className="w-full max-w-lg space-y-4">
      <Card className="w-full shadow-2xl border-slate-200 bg-white">
        <CardHeader className="space-y-2 pb-4">
          {/* Navigation Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 mb-2 border border-slate-200" role="tablist" aria-label="Portal Entry Method">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'SIGNIN'}
              onClick={() => {
                setAuthMode('SIGNIN');
                setFormError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'SIGNIN'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'SIGNUP'}
              onClick={() => {
                setAuthMode('SIGNUP');
                setFormError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'SIGNUP'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Sign Up</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'PIN'}
              onClick={() => {
                setAuthMode('PIN');
                setFormError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'PIN'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
              <span>Patient Kiosk</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl font-black text-slate-950">
              {authMode === 'SIGNIN' && 'Portal Sign In'}
              {authMode === 'SIGNUP' && 'Create Your Account'}
              {authMode === 'PIN' && 'Patient Bedside Kiosk'}
            </CardTitle>
            <Badge variant={authMode === 'PIN' ? 'default' : 'secondary'} className="text-xs">
              {authMode === 'SIGNIN' && 'Secure Login'}
              {authMode === 'SIGNUP' && 'Instant Access'}
              {authMode === 'PIN' && '4-Digit PIN'}
            </Badge>
          </div>
          <CardDescription className="text-slate-600 text-xs sm:text-sm">
            {authMode === 'SIGNIN' && 'Enter your registered email and password to access your role dashboard.'}
            {authMode === 'SIGNUP' && 'Register as a caregiver, family member, administrator, or patient.'}
            {authMode === 'PIN' && 'Designed for elderly tablet interaction. Enter your 4-digit patient PIN.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Error Message Alert */}
          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {signupSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{signupSuccess}</span>
            </div>
          )}

          {/* TAB 1: REAL SIGN IN FORM */}
          {authMode === 'SIGNIN' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md transition-all mt-2"
              >
                {isPending ? 'Authenticating...' : 'Sign In to Portal'}
              </Button>
            </form>
          )}

          {/* TAB 2: REAL SIGN UP FORM */}
          {authMode === 'SIGNUP' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="signupName" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Full Name
                </label>
                <input
                  id="signupName"
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith / John Doe"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="signupEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <input
                  id="signupEmail"
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="signupRole" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Your Role
                </label>
                <select
                  id="signupRole"
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                >
                  <option value="CARETAKER">Clinical Caregiver / Nurse</option>
                  <option value="FAMILY">Family Member (Care Circle)</option>
                  <option value="ADMIN">System Administrator</option>
                  <option value="PATIENT">Elderly Patient</option>
                </select>
              </div>

              {signupRole === 'PATIENT' && (
                <div className="space-y-1">
                  <label htmlFor="signupPin" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Patient 4-Digit Kiosk PIN
                  </label>
                  <input
                    id="signupPin"
                    type="password"
                    maxLength={4}
                    required
                    value={signupPin}
                    onChange={(e) => setSignupPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 font-mono tracking-widest"
                  />
                  <p className="text-[11px] text-slate-500">You will use this 4-digit PIN on the tablet kiosk.</p>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="signupPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password (At least 6 characters)
                </label>
                <input
                  id="signupPassword"
                  type="password"
                  required
                  minLength={6}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md transition-all mt-2"
              >
                {isPending ? 'Registering Account...' : 'Create Account & Launch Portal'}
              </Button>
            </form>
          )}

          {/* TAB 3: TACTILE KIOSK PIN KEYPAD */}
          {authMode === 'PIN' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-2 py-2">
                <div className="flex items-center gap-3">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`h-7 w-7 rounded-full border-2 transition-all ${
                          filled
                            ? 'border-teal-700 bg-teal-700 scale-110 shadow-sm'
                            : 'border-slate-300 bg-slate-100'
                        }`}
                      />
                    );
                  })}
                </div>

                {pinError && (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1 pt-1 text-center max-w-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{pinError}</span>
                  </p>
                )}

                {pinSuccess && (
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 pt-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>PIN Authenticated! Loading Patient Kiosk...</span>
                  </p>
                )}
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto" role="group" aria-label="PIN Keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    aria-label={`Digit ${digit}`}
                    disabled={isLocked || isPending}
                    onClick={() => handleKeypadPress(digit)}
                    className="h-14 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-100 active:bg-slate-200 text-2xl font-black text-slate-900 shadow-xs transition-colors flex items-center justify-center disabled:opacity-40"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  aria-label="Clear PIN entry"
                  disabled={isLocked || isPending}
                  onClick={handleClearPin}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 uppercase transition-colors flex items-center justify-center disabled:opacity-40"
                >
                  Clear
                </button>

                <button
                  type="button"
                  aria-label="Digit 0"
                  disabled={isLocked || isPending}
                  onClick={() => handleKeypadPress('0')}
                  className="h-14 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-100 active:bg-slate-200 text-2xl font-black text-slate-900 shadow-xs transition-colors flex items-center justify-center disabled:opacity-40"
                >
                  0
                </button>

                <button
                  type="button"
                  aria-label="Backspace PIN entry"
                  disabled={isLocked || isPending}
                  onClick={handleBackspacePin}
                  className="h-14 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 uppercase transition-colors flex items-center justify-center disabled:opacity-40"
                >
                  ⌫
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 font-medium">
                Patient Kiosk Mode &bull; Salted bcrypt PIN verification &bull; 5-attempt rate limiter
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 border-t border-slate-100 pt-4 pb-4 bg-slate-50/70 rounded-b-xl text-center">
          <p className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-teal-700 inline" />
            <span>Encrypted Session &bull; Role-Based Access Control &bull; MediCare Connect</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
