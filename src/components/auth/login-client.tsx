'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  HeartHandshake,
  ShieldCheck,
  Users,
  Sun,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import {
  signInAction,
  signInDemoRoleAction,
  acceptInviteAction,
  verifyPinAction,
} from '@/lib/actions/auth.actions';
import { DEMO_ROBERT_CHEN_ID } from '@/lib/constants';
import { UserRole } from '@/types';

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

  // Guide Toggle
  const [showRoleGuide, setShowRoleGuide] = useState(true);

  // 1. One-Click Demo Role Launcher
  const handleInstantDemoLogin = (role: UserRole) => {
    setFormError(null);
    startTransition(async () => {
      const res = await signInDemoRoleAction(role);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
      } else {
        setFormError(res.error || 'Failed to initialize demo session.');
      }
    });
  };

  // 2. Pre-fill credentials helper
  const handlePrefill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFormError(null);
  };

  // 3. Quick PIN auto-fill
  const handleAutoFillPin = () => {
    setPin('1234');
    setPinError(null);
    startTransition(async () => {
      const res = await verifyPinAction(DEMO_ROBERT_CHEN_ID, '1234');
      if (res.success) {
        setPinSuccess(true);
        setTimeout(() => {
          router.push('/patient');
        }, 500);
      } else {
        setPinError(res.error || 'Failed to authenticate PIN 1234.');
      }
    });
  };

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
          setPinError(res.error || 'Incorrect PIN. Try 1234 for demo patient Robert Chen.');
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
    <div className="w-full max-w-xl space-y-6">
      {/* 1. INSTANT ONE-CLICK DEMO PORTALS (TOP PROMINENCE) */}
      <div className="rounded-2xl border-2 border-teal-200/90 bg-white p-5 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-700 animate-pulse" />
            <span className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
              Instant One-Click Demo Access
            </span>
          </div>
          <Badge variant="default" className="bg-teal-700 text-white text-[11px] font-bold">
            No Setup Needed
          </Badge>
        </div>

        <p className="text-xs text-slate-600">
          Select any of the four stakeholder portals below to enter directly:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Caretaker Portal */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleInstantDemoLogin('CARETAKER')}
            className="p-3.5 rounded-xl border-2 border-teal-300 bg-teal-50/70 hover:bg-teal-100/90 text-left transition-all group flex flex-col justify-between min-h-[92px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-teal-700" />
                  Caretaker Portal
                </span>
                <ArrowRight className="h-4 w-4 text-teal-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">Nurse Sarah Jenkins</p>
              <p className="text-[11px] text-slate-500">Manage prescriptions, visits &amp; doses</p>
            </div>
          </button>

          {/* Patient Kiosk */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleInstantDemoLogin('PATIENT')}
            className="p-3.5 rounded-xl border-2 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/90 text-left transition-all group flex flex-col justify-between min-h-[92px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-emerald-700" />
                  Patient Kiosk
                </span>
                <ArrowRight className="h-4 w-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">Robert Chen (PIN: 1234)</p>
              <p className="text-[11px] text-slate-500">Large 60px buttons, skip reasons &amp; SOS</p>
            </div>
          </button>

          {/* Family Circle */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleInstantDemoLogin('FAMILY')}
            className="p-3.5 rounded-xl border-2 border-blue-300 bg-blue-50/70 hover:bg-blue-100/90 text-left transition-all group flex flex-col justify-between min-h-[92px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-700" />
                  Family Circle
                </span>
                <ArrowRight className="h-4 w-4 text-blue-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">David Chen (Son)</p>
              <p className="text-[11px] text-slate-500">Live adherence visibility &amp; check-ins</p>
            </div>
          </button>

          {/* Admin Console */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleInstantDemoLogin('ADMIN')}
            className="p-3.5 rounded-xl border-2 border-slate-300 bg-slate-50/80 hover:bg-slate-100 text-left transition-all group flex flex-col justify-between min-h-[92px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-slate-700" />
                  System Admin
                </span>
                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">Dr. Eleanor Vance</p>
              <p className="text-[11px] text-slate-500">Patient onboarding &amp; audit trails</p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. AUTHENTICATION TABS & FORM */}
      <Card className="w-full shadow-xl border-slate-200 bg-white">
        <CardHeader className="space-y-1 pb-4">
          {/* Tab Switcher */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 mb-3 border border-slate-200" role="tablist" aria-label="Authentication Method">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'STANDARD'}
              onClick={() => {
                setAuthMode('STANDARD');
                setFormError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                authMode === 'STANDARD'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                authMode === 'PIN'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                authMode === 'INVITE'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl font-bold text-slate-950">
              {authMode === 'STANDARD' && 'Staff & Family Login'}
              {authMode === 'PIN' && 'Patient PIN Kiosk'}
              {authMode === 'INVITE' && 'Accept Invitation'}
            </CardTitle>
            <Badge
              variant={authMode === 'PIN' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {authMode === 'STANDARD' && 'Role Access'}
              {authMode === 'PIN' && 'PIN: 1234'}
              {authMode === 'INVITE' && 'Registration'}
            </Badge>
          </div>
          <CardDescription className="text-slate-500 text-xs sm:text-sm">
            {authMode === 'STANDARD' && 'Enter your authorized credentials or use pre-fill chips below.'}
            {authMode === 'PIN' && 'Enter 4-digit PIN 1234 for demo patient Robert Chen.'}
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
              {/* Pre-fill Chips */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Quick Fill Demo Credentials:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePrefill('sarah.jenkins@hospital.org', 'password123')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-teal-300 text-teal-800 hover:bg-teal-50 transition-colors"
                  >
                    Sarah (Caretaker)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrefill('admin@medicareconnect.com', 'password123')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    Eleanor (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrefill('david.chen@family.org', 'password123')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-blue-300 text-blue-800 hover:bg-blue-50 transition-colors"
                  >
                    David (Family)
                  </button>
                </div>
              </div>

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
                    placeholder="name@organization.org"
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
                  <span className="text-xs text-slate-400 font-medium">
                    Demo: password123
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
                {isPending ? 'Verifying session...' : 'Sign In to Portal'}
              </Button>
            </form>
          )}

          {/* 2. KIOSK PIN KEYPAD */}
          {authMode === 'PIN' && (
            <div className="space-y-5">
              {/* Quick Auto-Fill PIN */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-950">Robert Chen&apos;s Demo PIN: 1234</p>
                  <p className="text-[11px] text-emerald-700">Tap to auto-fill &amp; launch kiosk</p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillPin}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  Enter PIN 1234
                </button>
              </div>

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

      {/* 3. INTERACTIVE ROLE GUIDE & TEST WALKTHROUGH */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setShowRoleGuide(!showRoleGuide)}
          className="w-full flex items-center justify-between text-left font-bold text-slate-900 text-sm hover:text-teal-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-teal-700" />
            <span>How To Use This App (Role Guide &amp; Test Walkthrough)</span>
          </div>
          {showRoleGuide ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showRoleGuide && (
          <div className="space-y-4 pt-2 text-xs text-slate-600 border-t border-slate-100 animate-in fade-in">
            <p className="leading-relaxed">
              MediCare Connect is built around a <strong>4-way care circle</strong>. You can test each perspective using the quick buttons above:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <HeartHandshake className="h-3.5 w-3.5 text-teal-700" />
                  1. Caretaker Portal (/caretaker)
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>What you do:</strong> View assigned patients, prescribe new medications, schedule clinical appointments, and resolve urgent assistance tickets.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-emerald-700" />
                  2. Patient Kiosk (/patient)
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>What you do:</strong> Designed for elderly tablets. Tap large 60px buttons to confirm today&apos;s dose, report a skip with a clinical reason, or hit the red SOS button.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-700" />
                  3. Family Circle (/family)
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>What you do:</strong> Peace-of-mind monitoring for adult children. See real-time weekly adherence (92%), upcoming visits, and send encouragement to your parent&apos;s tablet.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
                  4. Administrator Console (/admin)
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>What you do:</strong> System director view. Register new patient profiles, invite healthcare workers, and review the tamper-proof append-only audit log.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 space-y-1">
              <p className="font-bold text-teal-950 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                Recommended Testing Workflow:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-teal-900">
                <li>Click <strong>Caretaker Portal</strong> &rarr; Add a new prescription or review Robert Chen.</li>
                <li>Sign out or click <strong>Patient Kiosk</strong> &rarr; Tap &ldquo;Mark as Taken&rdquo; on Atorvastatin or tap &ldquo;Skip Dose&rdquo; with nausea.</li>
                <li>Click <strong>Family Circle</strong> &rarr; Notice Robert&apos;s adherence rate and send him an encouraging note.</li>
                <li>Click <strong>System Admin</strong> &rarr; See the immutable audit trail records of all recent actions.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
