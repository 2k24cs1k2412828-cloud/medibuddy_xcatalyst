'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import {
  AlertCircle,
  Plus,
  Clock,
  CheckCircle2,
  Phone,
  X,
  PhoneCall,
} from 'lucide-react';
import { resolveAssistanceRequest } from '@/lib/actions/assistance.actions';
import { addMedication } from '@/lib/actions/medication.actions';

interface PatientData {
  id: string;
  name: string;
  age: number;
  adherenceRate: number;
  nextDose: string;
  pendingDoses: number;
  openRequests: number;
  doctorVisit: string;
  doctorName: string;
  doctorClinic: string;
  visitAcknowledged: boolean;
  medications: Array<{
    id: string;
    name: string;
    dosage: string;
    form: string;
    schedule: string;
    status: 'TAKEN' | 'PENDING' | 'SKIPPED';
    statusText: string;
  }>;
  routines: Array<{
    title: string;
    description: string;
    completed: boolean;
  }>;
}

const INITIAL_PATIENTS: PatientData[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Robert Chen',
    age: 78,
    adherenceRate: 92,
    nextDose: '8:00 PM (Tonight)',
    pendingDoses: 1,
    openRequests: 1,
    doctorVisit: 'Thursday, 10:30 AM',
    doctorName: 'Dr. Arthur Vance, MD (Cardiology)',
    doctorClinic: 'St. Jude Medical Centre • Room 304',
    visitAcknowledged: true,
    medications: [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Metformin Hydrochloride',
        dosage: '500 mg',
        form: 'Tablet',
        schedule: 'Twice daily • Morning (8:00 AM) & Evening (8:00 PM) • With meals',
        status: 'TAKEN',
        statusText: 'Taken 8:05 AM',
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Lisinopril',
        dosage: '10 mg',
        form: 'Tablet',
        schedule: 'Once daily • Morning (8:00 AM) • Blood pressure regulation',
        status: 'TAKEN',
        statusText: 'Taken 8:05 AM',
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        name: 'Atorvastatin Calcium',
        dosage: '20 mg',
        form: 'Tablet',
        schedule: 'Once daily • Evening (8:00 PM) • Take after dinner',
        status: 'PENDING',
        statusText: 'Due 8:00 PM Tonight',
      },
    ],
    routines: [
      {
        title: 'Hydration: 6-8 Glasses of Water',
        description: 'Target: Spread throughout the day',
        completed: true,
      },
      {
        title: 'Gentle 15-Minute Morning Walk',
        description: 'Prescribed physical therapy routine',
        completed: true,
      },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Margaret Taylor',
    age: 82,
    adherenceRate: 75,
    nextDose: 'Tomorrow 8:00 AM',
    pendingDoses: 0,
    openRequests: 0,
    doctorVisit: 'Next Monday, 2:00 PM',
    doctorName: 'Dr. Sarah Connor, MD (Endocrinology)',
    doctorClinic: 'Mount Sinai Clinic • Suite 102',
    visitAcknowledged: false,
    medications: [
      {
        id: 'med-margaret-01',
        name: 'Alendronate Sodium',
        dosage: '70 mg',
        form: 'Tablet',
        schedule: 'Weekly • Monday morning on empty stomach with water',
        status: 'TAKEN',
        statusText: 'Taken 7:30 AM',
      },
      {
        id: 'med-margaret-02',
        name: 'Calcium + Vitamin D3',
        dosage: '600 mg',
        form: 'Tablet',
        schedule: 'Daily with dinner',
        status: 'TAKEN',
        statusText: 'Taken with dinner',
      },
    ],
    routines: [
      {
        title: 'Joint Mobility Stretches',
        description: 'Morning gentle routine for osteoporosis',
        completed: true,
      },
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Harold Kumar',
    age: 74,
    adherenceRate: 100,
    nextDose: 'Tomorrow 9:00 AM',
    pendingDoses: 0,
    openRequests: 0,
    doctorVisit: 'Dec 2, 11:00 AM',
    doctorName: 'Dr. James Wilson, MD (Cardiology)',
    doctorClinic: 'St. Jude Heart Institute',
    visitAcknowledged: true,
    medications: [
      {
        id: 'med-harold-01',
        name: 'Clopidogrel (Plavix)',
        dosage: '75 mg',
        form: 'Tablet',
        schedule: 'Once daily morning • Post-stent regimen',
        status: 'TAKEN',
        statusText: 'Taken 9:02 AM',
      },
    ],
    routines: [
      {
        title: 'Blood Pressure Log',
        description: 'Measure and record morning resting BP',
        completed: true,
      },
    ],
  },
];

export function CaretakerDashboardClient() {
  const [isPending, startTransition] = useTransition();
  const [patients, setPatients] = useState<PatientData[]>(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(INITIAL_PATIENTS[0].id);

  // Urgent Assistance Request state for Robert Chen
  const [urgentRequestResolved, setUrgentRequestResolved] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  // Add Medication Modal state
  const [addMedModalOpen, setAddMedModalOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medForm, setMedForm] = useState<'TABLET' | 'CAPSULE' | 'SYRUP' | 'DROPS'>('TABLET');
  const [medTime, setMedTime] = useState('08:00');
  const [medInstructions, setMedInstructions] = useState('');

  // Call simulation banner
  const [callBanner, setCallBanner] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const currentPatient =
    patients.find((p) => p.id === selectedPatientId) ?? patients[0];

  const handleResolveAlert = () => {
    setUrgentRequestResolved(true);
    setResolveModalOpen(false);
    setActionNotice('Assistance request resolved and clinical note appended to audit log.');
    setTimeout(() => setActionNotice(null), 5000);

    startTransition(async () => {
      await resolveAssistanceRequest(
        '99999999-9999-9999-9999-999999999999',
        resolutionNote || 'Caretaker contacted patient and refilled medication.'
      );
    });
  };

  const handleAddMedicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !medDosage) return;

    const newMedId = `med-custom-${Date.now()}`;
    const newMed = {
      id: newMedId,
      name: medName,
      dosage: medDosage,
      form: medForm,
      schedule: `Daily at ${medTime} • ${medInstructions || 'Take as prescribed'}`,
      status: 'PENDING' as const,
      statusText: `Due ${medTime}`,
    };

    setPatients((prev) =>
      prev.map((p) =>
        p.id === currentPatient.id
          ? { ...p, medications: [...p.medications, newMed] }
          : p
      )
    );

    setAddMedModalOpen(false);
    setMedName('');
    setMedDosage('');
    setMedInstructions('');
    setActionNotice(`Prescription "${medName} ${medDosage}" added for ${currentPatient.name}.`);
    setTimeout(() => setActionNotice(null), 5000);

    startTransition(async () => {
      await addMedication({
        patientId: currentPatient.id,
        name: medName,
        dosage: medDosage,
        form: medForm,
        frequencyType: 'DAILY',
        reminderTimes: [medTime],
        instructions: medInstructions,
        startDate: new Date().toISOString().split('T')[0],
      });
    });
  };

  const handleSimulateCall = (patientName: string) => {
    setCallBanner(`Calling ${patientName} (+1 555-234-5678)... Connected.`);
    setTimeout(() => setCallBanner(null), 5000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <WelcomeSection userName="Nurse Sarah Jenkins" role="CARETAKER" />

      {/* Action Notification */}
      {actionNotice && (
        <div className="p-4 rounded-xl bg-teal-800 text-white font-bold text-base flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="p-1 hover:bg-teal-900 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Call Banner */}
      {callBanner && (
        <div className="p-4 rounded-xl bg-blue-700 text-white font-bold text-base flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-amber-300 animate-pulse" />
            <span>{callBanner}</span>
          </div>
          <button onClick={() => setCallBanner(null)} className="p-1 hover:bg-blue-800 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          label="Assigned Patients"
          value={String(patients.length)}
          subtitle="All profiles active"
          iconName="HeartHandshake"
          variant="default"
        />
        <DashboardStatCard
          label="Today's Doses Scheduled"
          value="14"
          change="12 Confirmed Taken"
          trend="up"
          iconName="Pill"
          variant="success"
        />
        <DashboardStatCard
          label="Upcoming Appointments"
          value="2"
          subtitle="This week"
          iconName="Calendar"
          variant="info"
        />
        <DashboardStatCard
          label="Open Assistance Requests"
          value={urgentRequestResolved ? '0' : '1'}
          change={urgentRequestResolved ? 'All resolved' : '1 High Urgency'}
          trend={urgentRequestResolved ? 'up' : 'down'}
          iconName="AlertCircle"
          variant={urgentRequestResolved ? 'success' : 'danger'}
        />
      </div>

      {/* Urgent Alert Banner (Interactive) */}
      {!urgentRequestResolved && (
        <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-200 text-amber-900 shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950">
                  Patient Assistance Request: Robert Chen
                </span>
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              </div>
              <p className="text-sm text-amber-900/90 mt-0.5">
                &ldquo;Ran out of Atorvastatin 20mg refill. Need guidance on whether to take alternative tonight.&rdquo;
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
              onClick={() => setResolveModalOpen(true)}
            >
              Respond &amp; Resolve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 bg-white"
              onClick={() => handleSimulateCall('Robert Chen')}
            >
              <Phone className="h-4 w-4 mr-1.5 text-teal-700" />
              <span>Call Patient</span>
            </Button>
          </div>
        </div>
      )}

      {/* Patient Selection & Today's Schedule Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Patients Column */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">My Assigned Patients</CardTitle>
                <CardDescription>Select patient to view details</CardDescription>
              </div>
              <Badge variant="info">{patients.length} Patients</Badge>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {patients.map((p) => {
                const isSelected = p.id === currentPatient.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-teal-700 bg-teal-50/60 shadow-xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-base">{p.name}</span>
                      <Badge
                        variant={p.adherenceRate >= 90 ? 'success' : 'warning'}
                      >
                        {p.adherenceRate}% Adherence
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {p.age} yrs &bull; Next dose: {p.nextDose}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>{p.medications.length} prescriptions</span>
                      {isSelected && (
                        <span className="text-teal-800 font-bold">✓ Active View</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Upcoming Appointments Summary for Selected Patient */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Upcoming Doctor Visits</CardTitle>
              <CardDescription>Scheduled for {currentPatient.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-teal-800">
                  <span>CLINICAL VISIT</span>
                  <span>{currentPatient.doctorVisit}</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{currentPatient.doctorName}</p>
                <p className="text-xs text-slate-500">{currentPatient.doctorClinic}</p>
                <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {currentPatient.visitAcknowledged
                      ? 'Acknowledged by Patient'
                      : 'Pending Patient Acknowledgment'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Medication Plan & Live Adherence */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold">
                  Medication Schedule: {currentPatient.name}
                </CardTitle>
                <CardDescription>
                  Configure dosages, frequency, reminder times, and food instructions.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                onClick={() => setAddMedModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Add Medication</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentPatient.medications.map((med) => {
                  const isTaken = med.status === 'TAKEN';
                  return (
                    <div
                      key={med.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        isTaken
                          ? 'border-slate-200 bg-white'
                          : 'border-2 border-teal-200 bg-teal-50/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">{med.name}</span>
                          <Badge variant="default">{med.dosage}</Badge>
                          <Badge variant="secondary">{med.form}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">{med.schedule}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {isTaken ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{med.statusText}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                            <Clock className="h-4 w-4" />
                            <span>{med.statusText}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Daily Healthcare Routines Checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Daily Healthcare Routines</CardTitle>
              <CardDescription>
                Caretaker-defined wellness checklist for {currentPatient.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {currentPatient.routines.map((routine, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{routine.title}</p>
                      <p className="text-xs text-slate-500">{routine.description}</p>
                    </div>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RESOLVE ASSISTANCE MODAL */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Resolve Patient Assistance Request
              </h3>
              <button
                onClick={() => setResolveModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Robert Chen requested guidance regarding an Atorvastatin 20mg refill.
            </p>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Clinical Resolution Note
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="e.g. Spoke with patient. Advised to take regular tomorrow morning. Refill sent to CVS Pharmacy."
                className="w-full p-3 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-700 hover:bg-teal-800 text-white"
                onClick={handleResolveAlert}
                disabled={isPending}
              >
                Confirm &amp; Close Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEDICATION MODAL */}
      {addMedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Prescribe Medication for {currentPatient.name}
              </h3>
              <button
                onClick={() => setAddMedModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddMedicationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amlodipine"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 mg"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Form
                  </label>
                  <select
                    value={medForm}
                    onChange={(e) => setMedForm(e.target.value as 'TABLET' | 'CAPSULE' | 'SYRUP' | 'DROPS')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  >
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="DROPS">Drops</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={medTime}
                    onChange={(e) => setMedTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Daily"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Instructions / Food notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with morning breakfast"
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddMedModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                  disabled={isPending}
                >
                  Save Prescription
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
