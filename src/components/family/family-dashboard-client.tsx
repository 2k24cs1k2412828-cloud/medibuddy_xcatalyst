'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import {
  Clock,
  Phone,
  Heart,
  X,
  PhoneCall,
} from 'lucide-react';
import { sendFamilyEncouragement, familyLinkToPatient } from '@/lib/actions/clinical-data.actions';

export interface FamilyDashboardProps {
  initialData?: {
    actorName: string;
    patients?: any[];
    patient: any | null;
    medications: any[];
    appointments: any[];
    encouragements: any[];
    adherenceRate: number;
  };
}

export function FamilyDashboardClient({ initialData }: FamilyDashboardProps) {
  const [isPending, startTransition] = useTransition();

  const actorName = initialData?.actorName || 'Family Member';
  const patient = initialData?.patient;
  const patientName = patient?.fullName || 'Loved One';
  const patientAge = patient?.age || 75;
  const adherenceRate = initialData?.adherenceRate ?? 100;

  const medications = initialData?.medications || [];
  const takenCount = medications.filter((m) => m.status === 'TAKEN').length;
  const totalCount = medications.length;

  const [callNotice, setCallNotice] = useState<string | null>(null);
  const [encourageModalOpen, setEncourageModalOpen] = useState(false);
  const [encourageMessage, setEncourageMessage] = useState('');
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  // Connect to patient state
  const [selectedConnectPatientId, setSelectedConnectPatientId] = useState<string>(
    initialData?.patients && initialData.patients.length > 0 ? initialData.patients[0].id : ''
  );
  const [connectPin, setConnectPin] = useState<string>('');
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleCall = (name: string, phone: string) => {
    setCallNotice(`Calling ${name} (${phone})... Audio connected.`);
    setTimeout(() => setCallNotice(null), 5000);
  };

  const handleConnectPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnectPatientId) return;
    setConnectError(null);

    startTransition(async () => {
      const res = await familyLinkToPatient(selectedConnectPatientId, connectPin || undefined);
      if (res.success && res.patient) {
        setSentNotice(`Successfully connected to ${res.patient.fullName}'s care circle!`);
        window.location.reload();
      } else {
        setConnectError(res.error || 'Failed to connect. Please verify patient PIN.');
      }
    });
  };

  const handleSendEncouragement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!encourageMessage || !patient?.id) return;

    const messageText = encourageMessage;
    setEncourageModalOpen(false);
    setSentNotice(`Message sent directly to ${patientName}'s tablet: "${messageText}"`);
    setEncourageMessage('');
    setTimeout(() => setSentNotice(null), 6000);

    startTransition(async () => {
      await sendFamilyEncouragement(patient.id, messageText);
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <WelcomeSection userName={actorName} role="FAMILY" />

      {/* Call Audio Banner */}
      {callNotice && (
        <div role="status" aria-live="polite" className="p-4 rounded-xl bg-blue-700 text-white font-bold text-base flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-amber-300 animate-pulse" />
            <span>{callNotice}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss call status"
            onClick={() => setCallNotice(null)}
            className="h-11 w-11 flex items-center justify-center hover:bg-blue-800 rounded-lg text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Sent Message Notice */}
      {sentNotice && (
        <div role="status" aria-live="polite" className="p-4 rounded-xl bg-emerald-700 text-white font-bold text-base flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-300 fill-pink-300" />
            <span>{sentNotice}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss sent message"
            onClick={() => setSentNotice(null)}
            className="h-11 w-11 flex items-center justify-center hover:bg-emerald-800 rounded-lg text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {!patient ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto shadow-sm">
          <div className="h-16 w-16 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8 text-teal-700" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-900">Connect to Your Loved One</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Select your elderly relative or enter their 4-digit Bedside Kiosk PIN to view their live medication adherence and send them encouragement notes.
            </p>
          </div>

          {connectError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-semibold">
              {connectError}
            </div>
          )}

          {initialData?.patients && initialData.patients.length > 0 ? (
            <form onSubmit={handleConnectPatient} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Select Registered Patient
                </label>
                <select
                  value={selectedConnectPatientId}
                  onChange={(e) => setSelectedConnectPatientId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                >
                  {initialData.patients.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName || p.name} (Age {p.age})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  4-Digit Patient Kiosk PIN (Optional verification)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 1234"
                  value={connectPin}
                  onChange={(e) => setConnectPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending || !selectedConnectPatientId}
                className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-base"
              >
                {isPending ? 'Connecting...' : 'Connect to Care Circle'}
              </Button>
            </form>
          ) : (
            <p className="text-xs text-slate-400">
              No patients have been registered yet by your clinic administrator. Please contact your administrator.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Top Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardStatCard
              label="Monitored Loved One"
              value={patientName}
              subtitle={`Age ${patientAge} • Family Circle`}
              iconName="HeartHandshake"
              variant="default"
            />
            <DashboardStatCard
              label="Daily Adherence Rate"
              value={`${adherenceRate}%`}
              subtitle="Real-time compliance"
              change={`${adherenceRate}% on-time`}
              trend={adherenceRate >= 80 ? "up" : "down"}
              iconName="CheckCircle"
              variant={adherenceRate >= 80 ? "success" : "warning"}
            />
            <DashboardStatCard
              label="Next Doctor Visit"
              value={initialData?.appointments?.[0]?.scheduledAt || "No upcoming visits"}
              subtitle={initialData?.appointments?.[0]?.clinic || "Clinical Facility"}
              iconName="Calendar"
              variant="info"
            />
            <DashboardStatCard
              label="Today's Doses Taken"
              value={`${takenCount} of ${totalCount}`}
              subtitle={`${Math.max(0, totalCount - takenCount)} remaining today`}
              iconName="Pill"
              variant="warning"
            />
          </div>

          {/* Two-Column Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-2">
              {/* Today's Medication Tracker */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      Today&apos;s Medication Adherence: {patientName}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Live status updates transmitted from the bedside tablet kiosk.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold"
                    onClick={() => setEncourageModalOpen(true)}
                  >
                    <Heart className="h-4 w-4 mr-1.5 fill-white" />
                    <span>Send Note to Tablet</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {medications.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      No medications scheduled for today.
                    </div>
                  ) : (
                    medications.map((med) => (
                      <div
                        key={med.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{med.name}</span>
                            <Badge variant="outline" className="text-xs bg-white">
                              {med.dosage}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-teal-700" />
                            <span>{med.schedule}</span>
                          </p>
                        </div>
                        <Badge
                          variant={
                            med.status === 'TAKEN'
                              ? 'success'
                              : med.status === 'SKIPPED'
                              ? 'destructive'
                              : 'warning'
                          }
                          className="self-start sm:self-center"
                        >
                          {med.statusText || med.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar: Contact & Circle */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Direct Emergency Contacts
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    One-tap voice assistance to caregivers and emergency services.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{patientName}</p>
                      <p className="text-xs text-slate-500">Patient Bedside / Tablet</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-teal-300 text-teal-800 bg-white"
                      onClick={() => handleCall(patientName, patient.emergencyContactPhone || '+1 (555) 0123')}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      <span>Call</span>
                    </Button>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Primary Caregiver</p>
                      <p className="text-xs text-slate-500">Clinical Support Staff</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-teal-300 text-teal-800 bg-white"
                      onClick={() => handleCall('Caregiver', '+1 (555) 0199')}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      <span>Call</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ENCOURAGEMENT MODAL */}
      {encourageModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="encourage-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600 fill-pink-600" />
                <h3 id="encourage-modal-title" className="text-xl font-bold text-slate-900">
                  Send Heartfelt Message to {patientName}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close encouragement dialog"
                onClick={() => setEncourageModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSendEncouragement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Your Message (Will pop up on patient&apos;s morning tablet screen)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Love you! Remember to drink plenty of water today and have a wonderful afternoon!"
                  value={encourageMessage}
                  onChange={(e) => setEncourageMessage(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEncourageModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold"
                >
                  {isPending ? 'Sending...' : 'Send to Tablet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
