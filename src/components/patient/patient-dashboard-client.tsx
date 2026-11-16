'use client';

import React, { useState, useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import {
  Pill,
  CheckCircle2,
  AlertTriangle,
  X,
  PhoneCall,
  Sparkles,
  Heart,
} from 'lucide-react';
import {
  updateDoseStatus,
  triggerEmergencySos,
} from '@/lib/actions/clinical-data.actions';

export interface DoseItem {
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

export interface PatientDashboardProps {
  initialData?: {
    patient: any | null;
    medications: any[];
    appointments: any[];
    encouragements: any[];
  };
}

export function PatientDashboardClient({ initialData }: PatientDashboardProps) {
  const [isPending, startTransition] = useTransition();

  const patientName = initialData?.patient?.fullName || 'Patient';
  const patientId = initialData?.patient?.id || '';

  // Initial mapped doses from real medications or default
  const mappedDoses: DoseItem[] = (initialData?.medications || []).map((m: any, idx: number) => ({
    id: m.id,
    name: m.name,
    dosage: m.dosage,
    instructions: m.mealInstruction || m.instructions || 'Take as prescribed with water',
    timeSlot: idx % 2 === 0 ? 'Morning' : 'Evening',
    scheduledTime: m.schedule || '8:00 AM',
    status: m.status || 'PENDING',
    actionTime: m.takenAt,
    skipReason: m.skipReason,
  }));

  const [doses, setDoses] = useState<DoseItem[]>(mappedDoses);

  // Encouragements
  const [encouragements] = useState<any[]>(
    initialData?.encouragements || []
  );

  // Skip Modal state
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [selectedDoseForSkip, setSelectedDoseForSkip] = useState<DoseItem | null>(null);
  const [skipReason, setSkipReason] = useState<string>('');
  const [skipNotes, setSkipNotes] = useState<string>('');

  // Alerts
  const [helpAlertMessage, setHelpAlertMessage] = useState<string | null>(null);
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
      await updateDoseStatus(doseId, 'TAKEN');
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
      `Dose marked as skipped (${skipReason}). Your caregiver has been notified.`
    );
    setTimeout(() => setHelpAlertMessage(null), 6000);

    startTransition(async () => {
      await updateDoseStatus(doseId, 'SKIPPED', skipReason);
    });
  };

  const handleQuickHelp = (label: string, isUrgent: boolean = false) => {
    setHelpAlertMessage(
      isUrgent
        ? '🚨 EMERGENCY ALERT SENT! Calling your designated caregiver and emergency contact now...'
        : `✓ Assistance request sent: "${label}". Your caregiver has been notified.`
    );
    setTimeout(() => setHelpAlertMessage(null), 8000);

    startTransition(async () => {
      if (patientId) {
        await triggerEmergencySos(patientId, label);
      }
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Section */}
      <WelcomeSection
        userName={patientName}
        role="PATIENT"
        isPatient={true}
        patientSubtitle="Here is your simple, accessible medication checklist for today."
      />

      {/* Family Encouragement Notice */}
      {encouragements.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-xl flex items-center justify-between border-2 border-pink-300 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-white fill-white shrink-0 animate-bounce" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-pink-100">
                Message from {encouragements[0].fromName} ({encouragements[0].sentAt}):
              </p>
              <p className="text-xl font-black mt-0.5">&ldquo;{encouragements[0].message}&rdquo;</p>
            </div>
          </div>
        </div>
      )}

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
              completedCount === totalCount && totalCount > 0
                ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black'
                : 'bg-teal-100 text-teal-950 border-teal-300 font-bold'
            }
          >
            {completedCount} of {totalCount} Taken Today
          </Badge>
        </div>

        {doses.length === 0 ? (
          <div className="p-10 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center space-y-2">
            <Pill className="h-10 w-10 text-teal-700 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">No Prescriptions Due Today</h3>
            <p className="text-sm text-slate-500">Your doctor or caregiver will schedule your regimen here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {doses.map((dose) => {
              const isTaken = dose.status === 'TAKEN';
              const isSkipped = dose.status === 'SKIPPED';
              const isPendingDose = dose.status === 'PENDING';

              return (
                <Card
                  key={dose.id}
                  className={`p-6 sm:p-8 rounded-3xl border-2 transition-all ${
                    isTaken
                      ? 'border-emerald-300 bg-emerald-50/60'
                      : isSkipped
                      ? 'border-amber-300 bg-amber-50/50'
                      : 'border-slate-300 bg-white shadow-lg'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          {dose.scheduledTime} &bull; {dose.timeSlot}
                        </span>
                        {isTaken && (
                          <Badge variant="success" className="text-sm font-bold px-3 py-1">
                            ✓ Confirmed Taken
                          </Badge>
                        )}
                        {isSkipped && (
                          <Badge variant="warning" className="text-sm font-bold px-3 py-1">
                            Skipped: {dose.skipReason}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                          {dose.name}
                        </h3>
                        <p className="text-xl font-bold text-teal-900 mt-1">{dose.dosage}</p>
                        <p className="text-lg text-slate-700 font-medium mt-1">{dose.instructions}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-[320px]">
                      {isPendingDose && (
                        <>
                          <Button
                            size="lg"
                            disabled={isPending}
                            onClick={() => handleTakeDose(dose.id)}
                            className="h-16 px-8 text-xl font-black bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 grow"
                          >
                            <CheckCircle2 className="h-7 w-7" />
                            <span>I Have Taken This</span>
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleOpenSkipModal(dose)}
                            className="h-16 px-6 text-lg font-bold border-2 border-slate-300 hover:border-slate-400 bg-white rounded-2xl"
                          >
                            <span>Skip</span>
                          </Button>
                        </>
                      )}

                      {isTaken && (
                        <div className="flex items-center gap-3 text-emerald-800 font-black text-xl py-2 px-4 bg-emerald-100/70 rounded-2xl border border-emerald-300">
                          <CheckCircle2 className="h-7 w-7 text-emerald-700" />
                          <span>Logged at {dose.actionTime || '8:05 AM'}</span>
                        </div>
                      )}

                      {isSkipped && (
                        <div className="flex items-center gap-3 text-amber-900 font-bold text-lg py-2 px-4 bg-amber-100/70 rounded-2xl border border-amber-300">
                          <AlertTriangle className="h-6 w-6 text-amber-700" />
                          <span>Skipped ({dose.skipReason})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: ONE-TOUCH ASSISTANCE & EMERGENCY SOS */}
      <section className="p-6 sm:p-8 rounded-3xl border-2 border-rose-300 bg-rose-50/70 space-y-4 shadow-md">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-rose-700 shrink-0" />
          <div>
            <h3 className="text-2xl font-black text-rose-950">Need Help or Assistance?</h3>
            <p className="text-base text-rose-900 font-medium">
              Tap any button below to instantly alert your care team.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Button
            size="lg"
            onClick={() => handleQuickHelp('Emergency assistance requested from patient bedside', true)}
            className="min-h-[90px] h-20 text-2xl font-black bg-rose-700 hover:bg-rose-800 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3"
          >
            <PhoneCall className="h-8 w-8 animate-pulse" />
            <span>EMERGENCY SOS</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleQuickHelp('Patient requested medication refill guidance', false)}
            className="min-h-[90px] h-20 text-xl font-bold border-2 border-rose-400 bg-white hover:bg-rose-50 text-rose-950 rounded-2xl"
          >
            <Pill className="h-7 w-7 text-rose-700 mr-2" />
            <span>Need Medication Help</span>
          </Button>
        </div>
      </section>

      {/* SKIP MODAL DIALOG */}
      {skipModalOpen && selectedDoseForSkip && (
        <div role="dialog" aria-modal="true" aria-labelledby="skip-dialog-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-2 border-slate-300 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 id="skip-dialog-title" className="text-2xl font-black text-slate-950">
                  Skip {selectedDoseForSkip.name}?
                </h3>
                <p className="text-base text-slate-600 font-medium mt-1">
                  Please select the reason you are skipping this dose:
                </p>
              </div>
              <button
                type="button"
                aria-label="Close skip dialog"
                onClick={() => setSkipModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                'Experiencing Nausea / Upset Stomach',
                'Feeling Dizzy or Drowsy',
                'Physician Advised to Hold Dose',
                'Ran Out of Medication Refill',
                'Already Took Earlier Today',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSkipReason(reason)}
                  className={`p-4 rounded-2xl text-left font-bold text-lg border-2 transition-all ${
                    skipReason === reason
                      ? 'border-teal-700 bg-teal-50 text-teal-950 ring-2 ring-teal-700/20'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-white'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="skipNotes" className="block text-sm font-bold text-slate-700 mb-1">
                Additional Notes (Optional)
              </label>
              <input
                id="skipNotes"
                type="text"
                placeholder="e.g. Taking afternoon dose instead"
                value={skipNotes}
                onChange={(e) => setSkipNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setSkipModalOpen(false)}
                className="h-14 px-6 text-lg font-bold"
              >
                Cancel
              </Button>
              <Button
                size="lg"
                disabled={!skipReason || isPending}
                onClick={handleConfirmSkip}
                className="h-14 px-8 text-lg font-black bg-rose-700 hover:bg-rose-800 text-white"
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
