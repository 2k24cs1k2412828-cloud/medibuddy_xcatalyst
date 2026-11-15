'use client';

import React, { useState, useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import {
  Pill,
  Calendar,
  CheckCircle2,
  Sun,
  Moon,
  HelpCircle,
  Users,
  AlertTriangle,
  X,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { recordDoseAction } from '@/lib/actions/medication.actions';
import { acknowledgeAppointment } from '@/lib/actions/appointment.actions';
import { createAssistanceRequest } from '@/lib/actions/assistance.actions';
import { toggleRoutineLog } from '@/lib/actions/routine.actions';

interface DoseItem {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  timeSlot: 'Morning' | 'Afternoon' | 'Evening';
  scheduledTime: string;
  status: 'PENDING' | 'TAKEN' | 'SKIPPED';
  actionTime?: string;
  skipReason?: string;
}

export function PatientDashboardClient() {
  const [isPending, startTransition] = useTransition();

  // Dose state initialized with baseline demo data
  const [doses, setDoses] = useState<DoseItem[]>([
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddd01',
      name: 'Metformin Hydrochloride',
      dosage: '1 Tablet (500 mg)',
      instructions: 'Taken with morning breakfast and water',
      timeSlot: 'Morning',
      scheduledTime: '8:00 AM',
      status: 'TAKEN',
      actionTime: '8:05 AM',
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddd02',
      name: 'Lisinopril',
      dosage: '1 Tablet (10 mg)',
      instructions: 'For blood pressure regulation',
      timeSlot: 'Morning',
      scheduledTime: '8:00 AM',
      status: 'TAKEN',
      actionTime: '8:05 AM',
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddd03',
      name: 'Atorvastatin Calcium',
      dosage: '1 Tablet (20 mg)',
      instructions: 'Take with a glass of water after dinner',
      timeSlot: 'Evening',
      scheduledTime: '8:00 PM Tonight',
      status: 'PENDING',
    },
  ]);

  // Appointment state
  const [appointmentAcknowledged, setAppointmentAcknowledged] = useState(false);

  // Daily Habits state
  const [habitWater, setHabitWater] = useState(true);
  const [habitWalk, setHabitWalk] = useState(false);

  // Skip Modal state
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [selectedDoseForSkip, setSelectedDoseForSkip] = useState<DoseItem | null>(null);
  const [skipReason, setSkipReason] = useState<string>('');
  const [skipNotes, setSkipNotes] = useState<string>('');

  // Help / SOS Feedback Banner state
  const [helpAlertMessage, setHelpAlertMessage] = useState<string | null>(null);

  // Success Celebration banner
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  const completedCount = doses.filter((d) => d.status === 'TAKEN').length;
  const totalCount = doses.length;

  const handleTakeDose = (doseId: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setDoses((prev) =>
      prev.map((d) =>
        d.id === doseId
          ? { ...d, status: 'TAKEN', actionTime: timeString }
          : d
      )
    );

    setCelebrationMessage('Excellent! Your dose has been recorded as taken.');
    setTimeout(() => setCelebrationMessage(null), 5000);

    startTransition(async () => {
      await recordDoseAction(doseId, 'TAKEN');
    });
  };

  const handleOpenSkipModal = (dose: DoseItem) => {
    setSelectedDoseForSkip(dose);
    setSkipReason('');
    setSkipNotes('');
    setSkipModalOpen(true);
  };

  const handleConfirmSkip = () => {
    if (!selectedDoseForSkip || !skipReason) return;

    const doseId = selectedDoseForSkip.id;
    setDoses((prev) =>
      prev.map((d) =>
        d.id === doseId
          ? { ...d, status: 'SKIPPED', skipReason }
          : d
      )
    );

    setSkipModalOpen(false);
    setHelpAlertMessage(
      `Dose skipped (${skipReason}). Nurse Sarah Jenkins has been notified.`
    );
    setTimeout(() => setHelpAlertMessage(null), 6000);

    startTransition(async () => {
      await recordDoseAction(doseId, 'SKIPPED', skipReason, skipNotes);
    });
  };

  const handleAcknowledgeAppointment = () => {
    setAppointmentAcknowledged(true);
    setHelpAlertMessage('Appointment confirmed! David Chen & Nurse Sarah will accompany you.');
    setTimeout(() => setHelpAlertMessage(null), 5000);

    startTransition(async () => {
      await acknowledgeAppointment('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
    });
  };

  const handleQuickHelp = (
    category: 'UNAVAILABLE_MEDICINE' | 'SCHEDULE_CHANGE' | 'EMERGENCY_HELP',
    label: string
  ) => {
    const isUrgent = category === 'EMERGENCY_HELP';
    setHelpAlertMessage(
      isUrgent
        ? '🚨 EMERGENCY ALERT SENT! Calling Nurse Sarah Jenkins and David Chen now...'
        : `✓ Help request sent: "${label}". Your care team will respond shortly.`
    );
    setTimeout(() => setHelpAlertMessage(null), 8000);

    startTransition(async () => {
      await createAssistanceRequest(
        '11111111-1111-1111-1111-111111111111',
        category,
        isUrgent ? 'URGENT' : 'NORMAL',
        `Patient Robert Chen requested: ${label}`
      );
    });
  };

  const handleToggleHabit = (habitName: 'water' | 'walk') => {
    if (habitName === 'water') {
      const next = !habitWater;
      setHabitWater(next);
      startTransition(async () => {
        await toggleRoutineLog(
          'ffffffff-ffff-ffff-ffff-ffffffff0001',
          '11111111-1111-1111-1111-111111111111',
          next
        );
      });
    } else {
      const next = !habitWalk;
      setHabitWalk(next);
      startTransition(async () => {
        await toggleRoutineLog(
          'ffffffff-ffff-ffff-ffff-ffffffff0002',
          '11111111-1111-1111-1111-111111111111',
          next
        );
      });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Section */}
      <WelcomeSection
        userName="Robert"
        role="PATIENT"
        isPatient={true}
        patientSubtitle="Here is your simple, accessible health checklist for today."
      />

      {/* Floating Celebration Toast */}
      {celebrationMessage && (
        <div role="status" aria-live="polite" className="p-4 sm:p-5 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl shadow-xl flex items-center justify-between border-2 border-emerald-400 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
            <span>{celebrationMessage}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss celebration message"
            onClick={() => setCelebrationMessage(null)}
            className="h-11 w-11 flex items-center justify-center hover:bg-emerald-700 rounded-xl text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Floating Alert / Help Toast */}
      {helpAlertMessage && (
        <div role="status" aria-live="polite" className="p-4 sm:p-5 rounded-2xl bg-teal-800 text-white font-bold text-lg shadow-xl flex items-center justify-between border-2 border-teal-500 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <PhoneCall className="h-7 w-7 text-amber-300" />
            <span>{helpAlertMessage}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss help message"
            onClick={() => setHelpAlertMessage(null)}
            className="h-11 w-11 flex items-center justify-center hover:bg-teal-900 rounded-xl text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* SECTION 1: TODAY'S MEDICINES */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 flex items-center gap-3">
            <Pill className="h-8 w-8 text-teal-700" />
            <span>Today&apos;s Medicines</span>
          </h2>
          <Badge
            variant="patientLarge"
            className={
              completedCount === totalCount
                ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black'
                : 'bg-teal-100 text-teal-950 border-teal-300 font-bold'
            }
          >
            {completedCount === totalCount
              ? `All ${totalCount} Doses Completed! 🎉`
              : `${completedCount} of ${totalCount} Done`}
          </Badge>
        </div>

        <div className="space-y-4">
          {doses.map((dose) => {
            const isTaken = dose.status === 'TAKEN';
            const isSkipped = dose.status === 'SKIPPED';
            const isPendingDose = dose.status === 'PENDING';

            return (
              <Card
                key={dose.id}
                className={`p-5 sm:p-6 rounded-2xl transition-all shadow-sm ${
                  isTaken
                    ? 'border-2 border-emerald-300 bg-emerald-50/50'
                    : isSkipped
                    ? 'border-2 border-amber-300 bg-amber-50/50'
                    : 'border-4 border-teal-600 bg-white shadow-md'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      {dose.timeSlot === 'Morning' ? (
                        <Sun className="h-6 w-6 text-amber-600" />
                      ) : (
                        <Moon className="h-6 w-6 text-indigo-700" />
                      )}
                      <span className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                        {dose.timeSlot} &bull; {dose.scheduledTime}
                      </span>
                      {isPendingDose && (
                        <Badge variant="warning" className="text-sm font-black px-2.5 py-0.5">
                          Ready to Take
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                      {dose.name}
                    </h3>
                    <p className="text-lg text-slate-800 font-semibold">
                      {dose.dosage} &bull; {dose.instructions}
                    </p>
                  </div>

                  {/* Actions / Status */}
                  <div className="shrink-0 flex items-center">
                    {isTaken && (
                      <div className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-700 text-white font-black text-lg shadow-sm border border-emerald-800">
                        <CheckCircle2 className="h-6 w-6" />
                        <span>Confirmed Taken at {dose.actionTime || '8:05 AM'}</span>
                      </div>
                    )}

                    {isSkipped && (
                      <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-amber-200 text-amber-950 font-black text-base border border-amber-400">
                        <AlertTriangle className="h-5 w-5 text-amber-800" />
                        <span>Skipped: {dose.skipReason || 'Recorded'}</span>
                      </div>
                    )}

                    {isPendingDose && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        <Button
                          variant="patientSuccess"
                          className="min-h-[64px] text-xl sm:text-2xl font-black px-8"
                          onClick={() => handleTakeDose(dose.id)}
                          disabled={isPending}
                        >
                          <CheckCircle2 className="mr-3 h-7 w-7" />
                          <span>I Took This Medicine</span>
                        </Button>
                        <Button
                          variant="patientSecondary"
                          className="min-h-[64px] text-lg font-bold px-6"
                          onClick={() => handleOpenSkipModal(dose)}
                          disabled={isPending}
                        >
                          <span>Skip / Need Help</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: DOCTOR APPOINTMENT */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-teal-700" />
          <span>Upcoming Doctor Visit</span>
        </h2>

        <Card className="border-2 border-blue-300 bg-blue-50/50 p-6 rounded-2xl shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <Badge variant="info" className="text-sm font-bold uppercase">
                This Thursday &bull; 10:30 AM
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                Heart Checkup with Dr. Arthur Vance
              </h3>
              <p className="text-lg text-slate-700 font-medium">
                St. Jude Medical Centre &bull; Suite 304, 750 Health Plaza Blvd
              </p>
              <p className="text-base text-slate-600 font-semibold">
                Note: Fast for 8 hours prior. Your son David Chen is confirmed to escort you.
              </p>
            </div>

            <div className="shrink-0 flex items-center">
              {appointmentAcknowledged ? (
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border-2 border-emerald-600 text-emerald-800 font-bold text-lg">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <span>You Acknowledged This Visit</span>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="min-h-[60px] text-xl font-black px-6 bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={handleAcknowledgeAppointment}
                  disabled={isPending}
                >
                  <CheckCircle2 className="mr-2 h-6 w-6" />
                  <span>Acknowledge Visit</span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* SECTION 3: DAILY HEALTH HABITS */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-teal-700" />
          <span>Daily Health Habits</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleToggleHabit('water')}
            className={`p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-colors ${
              habitWater
                ? 'border-emerald-300 bg-emerald-50/60'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div>
              <p className="text-xl font-black text-slate-950">Drink 6 Glasses of Water</p>
              <p className="text-base text-slate-600 font-medium">
                {habitWater ? 'Hydration goal completed today' : 'Tap to mark completed'}
              </p>
            </div>
            <div
              className={`h-11 w-11 rounded-full flex items-center justify-center font-black text-xl transition-colors ${
                habitWater ? 'bg-emerald-700 text-white' : 'border-2 border-slate-300 text-slate-400'
              }`}
            >
              {habitWater ? '✓' : ''}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleToggleHabit('walk')}
            className={`p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-colors ${
              habitWalk
                ? 'border-emerald-300 bg-emerald-50/60'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div>
              <p className="text-xl font-black text-slate-950">15-Minute Morning Walk</p>
              <p className="text-base text-slate-600 font-medium">
                {habitWalk ? 'Walk completed today' : 'Tap to mark completed'}
              </p>
            </div>
            <div
              className={`h-11 w-11 rounded-full flex items-center justify-center font-black text-xl transition-colors ${
                habitWalk ? 'bg-emerald-700 text-white' : 'border-2 border-slate-300 text-slate-400'
              }`}
            >
              {habitWalk ? '✓' : ''}
            </div>
          </button>
        </div>
      </section>

      {/* SECTION 4: NEED HELP / SOS */}
      <section id="request-help" className="space-y-4 scroll-mt-24">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-red-600" />
          <span>Need Help from Caretaker?</span>
        </h2>
        <p className="text-lg text-slate-600 font-medium">
          Tap any button below to send an immediate alert to Nurse Sarah Jenkins:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => handleQuickHelp('UNAVAILABLE_MEDICINE', 'Medicine Refill Needed')}
            className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-left space-y-1.5 transition-colors min-h-[90px]"
          >
            <p className="text-xl font-black text-amber-950">Medicine Refill Needed</p>
            <p className="text-sm text-amber-800 font-semibold">
              Alert caretaker that pills are running low
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickHelp('SCHEDULE_CHANGE', 'Change Reminder Schedule')}
            className="p-5 rounded-2xl border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-left space-y-1.5 transition-colors min-h-[90px]"
          >
            <p className="text-xl font-black text-blue-950">Change Schedule Request</p>
            <p className="text-sm text-blue-800 font-semibold">
              Request a different reminder time
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickHelp('EMERGENCY_HELP', 'Feeling Unwell / SOS Emergency')}
            className="p-5 rounded-2xl border-2 border-red-400 bg-red-100 hover:bg-red-200 active:bg-red-300 text-left space-y-1.5 transition-colors min-h-[90px]"
          >
            <p className="text-xl font-black text-red-950 flex items-center gap-2">
              <span>Feeling Unwell / SOS</span>
              <AlertTriangle className="h-5 w-5 text-red-700" />
            </p>
            <p className="text-sm text-red-800 font-semibold">
              Immediate phone call alert to family &amp; caretaker
            </p>
          </button>
        </div>
      </section>

      {/* SECTION 5: CARE CIRCLE TRANSPARENCY */}
      <section className="p-6 rounded-2xl border-2 border-slate-200 bg-white space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-teal-700" />
          <h3 className="text-xl font-black text-slate-900">Your Authorized Care Circle</h3>
        </div>
        <p className="text-base text-slate-600 font-medium">
          People authorized to view and assist your healthcare profile:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="px-3.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-bold text-sm">
            Nurse Sarah Jenkins (Primary Caretaker)
          </span>
          <span className="px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-sm">
            David Chen (Son &bull; Family Escort)
          </span>
          <span className="px-3.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm">
            Dr. Eleanor Vance (Platform Physician)
          </span>
        </div>
      </section>

      {/* SKIP REASON ACCESSIBLE DIALOG */}
      {skipModalOpen && selectedDoseForSkip && (
        <div role="dialog" aria-modal="true" aria-labelledby="skip-dialog-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-slate-300 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 id="skip-dialog-title" className="text-2xl font-black text-slate-950">
                  Skip {selectedDoseForSkip.name}?
                </h3>
                <p className="text-base text-slate-600 font-medium mt-1">
                  Please let Nurse Sarah know why you are skipping this dose:
                </p>
              </div>
              <button
                type="button"
                aria-label="Close skip dialog"
                onClick={() => setSkipModalOpen(false)}
                className="h-12 w-12 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Accessible Large Buttons for Reasons */}
            <div className="space-y-3">
              {[
                'Felt nauseous or unwell',
                'Ran out of medication',
                'Doctor advised to hold',
                'Already took outside schedule',
                'Other reason',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSkipReason(reason)}
                  className={`w-full p-4 rounded-xl border-2 text-left text-lg font-bold transition-all ${
                    skipReason === reason
                      ? 'border-teal-700 bg-teal-50 text-teal-950 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {skipReason === reason ? '✓ ' : ''}
                  {reason}
                </button>
              ))}
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Additional Note (Optional)
              </label>
              <input
                type="text"
                value={skipNotes}
                onChange={(e) => setSkipNotes(e.target.value)}
                placeholder="e.g. Will take tomorrow morning instead"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="w-1/2 py-4 text-lg font-bold"
                onClick={() => setSkipModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="w-1/2 py-4 text-lg font-bold bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleConfirmSkip}
                disabled={!skipReason || isPending}
              >
                Confirm Skip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
