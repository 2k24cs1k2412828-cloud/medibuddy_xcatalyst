'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Mail, KeyRound, CheckCircle2, AlertCircle, UserPlus } from 'lucide-react';
import { signInAction, acceptInviteAction, verifyPinAction } from '@/lib/actions/auth.actions';
import { DEMO_ROBERT_CHEN_ID } from '@/lib/constants';

export function LoginClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authMode, setAuthMode] = useState<'STANDARD' | 'PIN' | 'INVITE'>('STANDARD');

  // Standard Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Invitation Form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<'CARETAKER' | 'FAMILY'>('CARETAKER');
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Kiosk PIN Keypad
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await signInAction(email, password);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
      } else {
        setFormError(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const res = await acceptInviteAction({
        email: inviteEmail,
        password: invitePassword,
        fullName: inviteName,
        role: inviteRole,
      });

      if (res.success) {
        setInviteSuccess(`Account created! Redirecting to ${inviteRole} portal...`);
        setTimeout(() => {
          router.push(res.redirectUrl || '/caretaker');
        }, 1200);
      } else {
        setFormError(res.error || 'Failed to complete registration.');
      }
    });
  };

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
          }, 600);
        } else {
          setPin('');
          setPinError(res.error || 'Incorrect PIN.');
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
    <Card className="w-full max-w-md shadow-xl border-slate-200 bg-white">
      <CardHeader className="space-y-1 pb-4">
        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-2 border border-slate-200" role="tablist" aria-label="Authentication Method">
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'STANDARD'}
            onClick={() => {
              setAuthMode('STANDARD');
              setFormError(null);
            }}
            className={`w-1/3 py-2 rounded-lg text-xs font-bold transition-all ${
              authMode === 'STANDARD'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'PIN'}
            onClick={() => {
              setAuthMode('PIN');
              setFormError(null);
            }}
            className={`w-1/3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              authMode === 'PIN'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Kiosk PIN</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'INVITE'}
            onClick={() => {
              setAuthMode('INVITE');
              setFormError(null);
            }}
            className={`w-1/3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              authMode === 'INVITE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            {authMode === 'STANDARD' && 'Staff & Family Login'}
            {authMode === 'PIN' && 'Patient PIN Kiosk'}
            {authMode === 'INVITE' && 'Accept Invitation'}
          </CardTitle>
          <Badge
            variant={authMode === 'PIN' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {authMode === 'STANDARD' && 'Supabase Auth'}
            {authMode === 'PIN' && 'Robert Chen'}
            {authMode === 'INVITE' && 'Registration'}
          </Badge>
        </div>
        <CardDescription>
          {authMode === 'STANDARD' && 'Enter your credentials to access your authorized role dashboard.'}
          {authMode === 'PIN' && 'Enter your 4-digit numeric PIN for elderly-friendly kiosk access.'}
          {authMode === 'INVITE' && 'Create your authorized caregiver or family circle account.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Global Error Alert */}
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* 1. STANDARD SIGN IN */}
        {authMode === 'STANDARD' && (
          <form onSubmit={handleStandardSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah.jenkins@hospital.org"
                  className="flex h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-xs text-teal-700 font-semibold cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-sm mt-3"
              disabled={isPending}
            >
              {isPending ? 'Verifying session...' : 'Sign In with Supabase Auth'}
            </Button>
          </form>
        )}

        {/* 2. KIOSK PIN KEYPAD */}
        {authMode === 'PIN' && (
          <div className="space-y-5">
            {/* PIN Dots Display */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className="flex gap-4">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`h-6 w-6 rounded-full border-2 transition-all ${
                        filled
                          ? 'border-teal-700 bg-teal-700 scale-110'
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
                  <span>PIN Authenticated! Loading Kiosk Session...</span>
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
              Patient Kiosk Mode &bull; Server-side bcrypt verified &bull; 5-attempt rate lockout
            </p>
          </div>
        )}

        {/* 3. ACCEPT INVITATION / REGISTRATION */}
        {authMode === 'INVITE' && (
          <form onSubmit={handleInviteSubmit} className="space-y-3.5">
            {inviteSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            <div>
              <label htmlFor="inviteName" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Full Legal Name
              </label>
              <input
                id="inviteName"
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Nurse Sarah Jenkins"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>

            <div>
              <label htmlFor="inviteEmail" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Invited Email Address
              </label>
              <input
                id="inviteEmail"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@hospital.org"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>

            <div>
              <label htmlFor="inviteRole" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Role (Select Authorized Circle)
              </label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'CARETAKER' | 'FAMILY')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              >
                <option value="CARETAKER">Clinical Caretaker</option>
                <option value="FAMILY">Family Member</option>
              </select>
            </div>

            <div>
              <label htmlFor="invitePassword" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                New Password (Minimum 8 chars)
              </label>
              <input
                id="invitePassword"
                type="password"
                required
                minLength={8}
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white mt-2"
              disabled={isPending}
            >
              {isPending ? 'Registering...' : 'Create Account & Accept Invitation'}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 border-t border-slate-100 pt-4 pb-4 bg-slate-50/70 rounded-b-xl text-center">
        <p className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-teal-700 inline" />
          <span>Encrypted Session &bull; Role-Based Access Control &bull; MediCare Connect</span>
        </p>
      </CardFooter>
    </Card>
  );
}
