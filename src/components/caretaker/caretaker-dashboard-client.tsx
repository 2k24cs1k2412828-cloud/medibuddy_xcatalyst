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
  UserPlus,
  Users,
  CalendarPlus,
} from 'lucide-react';
import {
  registerNewPatient,
  prescribeMedication,
  scheduleAppointment,
  resolveAssistance,
} from '@/lib/actions/clinical-data.actions';

export interface PatientData {
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

export interface CaretakerDashboardProps {
  initialData?: {
    patients: any[];
    activePatient: any | null;
    medications: any[];
    appointments: any[];
    assistanceRequests: any[];
    actorName: string;
  };
}

export function CaretakerDashboardClient({ initialData }: CaretakerDashboardProps) {
  const [isPending, startTransition] = useTransition();

  // Map initialData patients dynamically from real clinical records
  const mappedInitialPatients: PatientData[] = (initialData?.patients || []).map((p: any) => {
    const patientMeds = (initialData?.medications || []).filter((m: any) => m.patientId === p.id);
    const pendingMeds = patientMeds.filter((m: any) => m.status === 'PENDING');
    const patientAppts = (initialData?.appointments || []).filter((a: any) => a.patientId === p.id);
    const nextAppt = patientAppts.length > 0 ? patientAppts[0] : null;

    return {
      id: p.id,
      name: p.fullName || p.name,
      age: p.age || 75,
      adherenceRate: p.adherenceRate ?? 100,
      nextDose: pendingMeds.length > 0 ? (pendingMeds[0].schedule || 'Scheduled Today') : (patientMeds.length > 0 ? 'All doses taken today' : 'No prescriptions active'),
      pendingDoses: pendingMeds.length,
      openRequests: (initialData?.assistanceRequests || []).filter((r: any) => r.patientId === p.id && r.status === 'OPEN').length,
      doctorVisit: nextAppt ? nextAppt.scheduledAt : 'No upcoming visits',
      doctorName: nextAppt ? nextAppt.doctorName : 'To be scheduled',
      doctorClinic: nextAppt ? nextAppt.clinic : 'Clinical Facility',
      visitAcknowledged: Boolean(nextAppt),
      medications: patientMeds.map((m: any) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        form: m.form || 'Tablet',
        schedule: m.schedule,
        status: m.status,
        statusText: m.statusText,
      })),
      routines: [
        {
          title: 'Daily Blood Pressure Log',
          description: 'Check resting BP before morning medications',
          completed: true,
        },
        {
          title: 'Hydration Intake Goal',
          description: 'Track daily 1.5L fluid intake',
          completed: false,
        },
      ],
    };
  });

  const [patients, setPatients] = useState<PatientData[]>(mappedInitialPatients);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    mappedInitialPatients.length > 0 ? mappedInitialPatients[0].id : ''
  );

  // Assistance requests state
  const [assistanceRequests, setAssistanceRequests] = useState<any[]>(
    initialData?.assistanceRequests || []
  );

  // Modals state
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedRequestId] = useState<string | null>(null);
  const [addMedModalOpen, setAddMedModalOpen] = useState(false);
  const [registerPatientModalOpen, setRegisterPatientModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Schedule Appointment form
  const [apptDoctorName, setApptDoctorName] = useState('');
  const [apptClinic, setApptClinic] = useState('');
  const [apptDateTime, setApptDateTime] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  // Add Medication form
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medForm, setMedForm] = useState<'TABLET' | 'CAPSULE' | 'SYRUP' | 'DROPS'>('TABLET');
  const [medTime, setMedTime] = useState('08:00 AM');
  const [medInstructions, setMedInstructions] = useState('');

  // Register Patient form
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('1950-01-01');
  const [newPatientGender, setNewPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [newPatientContactName, setNewPatientContactName] = useState('');
  const [newPatientContactPhone, setNewPatientContactPhone] = useState('');
  const [newPatientPin, setNewPatientPin] = useState('1234');
  const [newPatientConditions, setNewPatientConditions] = useState('');
  const [newPatientAllergies, setNewPatientAllergies] = useState('');

  // Banners & Notifications
  const [callBanner, setCallBanner] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const currentPatient =
    patients.find((p) => p.id === selectedPatientId) ?? patients[0];

  const handleResolveAlert = (reqId: string) => {
    setResolveModalOpen(false);
    setAssistanceRequests((prev) => prev.filter((r) => r.id !== reqId));
    setActionNotice('Assistance request resolved successfully.');
    setTimeout(() => setActionNotice(null), 5000);

    startTransition(async () => {
      await resolveAssistance(reqId);
    });
  };

  const handleAddMedicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !medDosage || !currentPatient) return;

    const newMedId = `med-custom-${Date.now()}`;
    const newMed = {
      id: newMedId,
      name: medName,
      dosage: medDosage,
      form: medForm,
      schedule: `Daily at ${medTime} • ${medInstructions || 'Take as prescribed'}`,
      status: 'PENDING' as const,
      statusText: `Scheduled ${medTime}`,
    };

    setPatients((prev) =>
      prev.map((p) =>
        p.id === currentPatient.id
          ? { ...p, medications: [...p.medications, newMed] }
          : p
      )
    );

    setAddMedModalOpen(false);
    const targetName = currentPatient.name;
    setMedName('');
    setMedDosage('');
    setMedInstructions('');
    setActionNotice(`Prescription "${medName} ${medDosage}" prescribed for ${targetName}.`);
    setTimeout(() => setActionNotice(null), 5000);

    startTransition(async () => {
      await prescribeMedication({
        patientId: currentPatient.id,
        name: medName,
        dosage: medDosage,
        form: medForm,
        schedule: `Daily at ${medTime}`,
        mealInstruction: medInstructions,
      });
    });
  };

  const handleScheduleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptDoctorName || !apptClinic || !currentPatient) return;

    const scheduledDateStr = apptDateTime || 'Thursday, 10:30 AM';
    setPatients((prev) =>
      prev.map((p) =>
        p.id === currentPatient.id
          ? {
              ...p,
              doctorVisit: scheduledDateStr,
              doctorName: apptDoctorName,
              doctorClinic: apptClinic,
              visitAcknowledged: true,
            }
          : p
      )
    );

    setScheduleModalOpen(false);
    setActionNotice(`Doctor visit with ${apptDoctorName} scheduled for ${currentPatient.name}.`);
    setTimeout(() => setActionNotice(null), 5000);

    startTransition(async () => {
      await scheduleAppointment({
        patientId: currentPatient.id,
        doctorName: apptDoctorName,
        clinic: apptClinic,
        scheduledAt: scheduledDateStr,
        notes: apptNotes,
      });
    });

    setApptDoctorName('');
    setApptClinic('');
    setApptDateTime('');
    setApptNotes('');
  };

  const handleRegisterPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientContactName) return;

    const conditions = newPatientConditions.split(',').map((s) => s.trim()).filter(Boolean);
    const allergies = newPatientAllergies.split(',').map((s) => s.trim()).filter(Boolean);

    startTransition(async () => {
      const res = await registerNewPatient({
        fullName: newPatientName,
        dob: newPatientDob,
        gender: newPatientGender,
        emergencyContactName: newPatientContactName,
        emergencyContactPhone: newPatientContactPhone,
        medicalConditions: conditions,
        allergies,
        pin: newPatientPin || '1234',
      });

      if (res.success && res.patient) {
        const added: PatientData = {
          id: res.patient.id,
          name: res.patient.fullName,
          age: res.patient.age,
          adherenceRate: 100,
          nextDose: '8:00 AM Tomorrow',
          pendingDoses: 0,
          openRequests: 0,
          doctorVisit: 'To be scheduled',
          doctorName: 'Primary Care Physician',
          doctorClinic: 'Community Health Centre',
          visitAcknowledged: false,
          medications: [],
          routines: [],
        };

        setPatients((prev) => [added, ...prev]);
        setSelectedPatientId(added.id);
        setRegisterPatientModalOpen(false);
        setNewPatientName('');
        setNewPatientContactName('');
        setNewPatientContactPhone('');
        setNewPatientConditions('');
        setNewPatientAllergies('');
        setActionNotice(`Patient "${added.name}" registered! Bedside Kiosk PIN: ${newPatientPin} | Web Login: ${res.patient.loginEmail}`);
        setTimeout(() => setActionNotice(null), 8000);
      }
    });
  };

  const handleSimulateCall = (patientName: string) => {
    setCallBanner(`Calling ${patientName}... Audio line open.`);
    setTimeout(() => setCallBanner(null), 5000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <WelcomeSection userName={initialData?.actorName || 'Clinical Caregiver'} role="CARETAKER" />
        <Button
          onClick={() => setRegisterPatientModalOpen(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold h-11 px-5 shadow-sm shrink-0"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span>Register New Patient</span>
        </Button>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div role="status" aria-live="polite" className="p-4 rounded-xl bg-teal-800 text-white font-bold text-base flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setActionNotice(null)}
            className="h-11 w-11 flex items-center justify-center hover:bg-teal-900 rounded-lg text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Call Audio Banner */}
      {callBanner && (
        <div role="status" aria-live="polite" className="p-4 rounded-xl bg-blue-700 text-white font-bold text-base flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-amber-300 animate-pulse" />
            <span>{callBanner}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss call status"
            onClick={() => setCallBanner(null)}
            className="h-11 w-11 flex items-center justify-center hover:bg-blue-800 rounded-lg text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Real-Time Open Assistance Requests */}
      {assistanceRequests.map((req) => (
        <div key={req.id} className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-200 text-amber-900 shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950">
                  Assistance Alert: {req.patientName}
                </span>
                <Badge variant="destructive" className="text-xs">
                  {req.type === 'EMERGENCY_SOS' ? 'EMERGENCY SOS' : 'Urgent'}
                </Badge>
              </div>
              <p className="text-sm text-amber-900/90 mt-0.5">&ldquo;{req.message}&rdquo;</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              size="sm"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
              onClick={() => handleResolveAlert(req.id)}
            >
              Respond &amp; Resolve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 bg-white"
              onClick={() => handleSimulateCall(req.patientName)}
            >
              <Phone className="h-4 w-4 mr-1.5 text-teal-700" />
              <span>Call Patient</span>
            </Button>
          </div>
        </div>
      ))}

      {/* When no patients are registered yet */}
      {patients.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Users className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">No Patients Registered Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Get started by registering an elderly individual under your care. You will be able to manage their prescriptions, schedule clinical visits, and monitor daily adherence.
            </p>
          </div>
          <Button
            onClick={() => setRegisterPatientModalOpen(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold h-12 px-6 shadow-md"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            <span>Register Your First Patient</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Patient Selector Strip */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
                Your Assigned Patients ({patients.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {patients.map((p) => {
                const isSelected = p.id === currentPatient?.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${
                      isSelected
                        ? 'border-teal-700 bg-white shadow-md ring-2 ring-teal-700/20'
                        : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-base">{p.name}</span>
                      <Badge variant={p.adherenceRate >= 85 ? 'success' : 'warning'} className="text-xs">
                        {p.adherenceRate}% Adherence
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Age {p.age} &bull; {p.medications.length} active prescription{p.medications.length === 1 ? '' : 's'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {currentPatient && (
            <>
              {/* Patient Key Metrics */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardStatCard
                  label="Daily Adherence Rate"
                  value={`${currentPatient.adherenceRate}%`}
                  iconName="CheckCircle"
                  change={`${currentPatient.adherenceRate}% on-time`}
                  trend={currentPatient.adherenceRate >= 80 ? "up" : "down"}
                  variant={currentPatient.adherenceRate >= 80 ? "success" : "warning"}
                />
                <DashboardStatCard
                  label="Active Prescriptions"
                  value={String(currentPatient.medications.length)}
                  iconName="Pill"
                  subtitle="Monitored daily"
                  variant="default"
                />
                <DashboardStatCard
                  label="Upcoming Doctor Visit"
                  value={currentPatient.doctorVisit}
                  iconName="Calendar"
                  subtitle={currentPatient.doctorClinic}
                  variant="info"
                />
                <DashboardStatCard
                  label="Emergency Contacts"
                  value="1 Confirmed"
                  iconName="HeartHandshake"
                  subtitle="Family Circle linked"
                  variant="default"
                />
              </div>

              {/* Medication Management Section */}
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-950">
                      Prescription Regimen: {currentPatient.name}
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs mt-0.5">
                      Clinical dosages, schedules, and patient adherence records.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setScheduleModalOpen(true)}
                      variant="outline"
                      className="border-teal-700 text-teal-800 hover:bg-teal-50 font-semibold text-xs h-9 px-3"
                    >
                      <CalendarPlus className="h-4 w-4 mr-1.5" />
                      <span>Schedule Visit</span>
                    </Button>
                    <Button
                      onClick={() => setAddMedModalOpen(true)}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs h-9 px-4"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      <span>Prescribe Medication</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentPatient.medications.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      No medications prescribed yet for this patient. Click &ldquo;Prescribe Medication&rdquo; above.
                    </div>
                  ) : (
                    currentPatient.medications.map((med) => (
                      <div
                        key={med.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{med.name}</span>
                            <Badge variant="outline" className="text-xs bg-white">
                              {med.dosage}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {med.form}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
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
            </>
          )}
        </>
      )}

      {/* MODAL: Resolve Assistance Request */}
      {resolveModalOpen && selectedRequestId && (
        <div role="dialog" aria-modal="true" aria-labelledby="resolve-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="resolve-modal-title" className="text-xl font-bold text-slate-900">
                Resolve Patient Request
              </h3>
              <button
                type="button"
                aria-label="Close resolve dialog"
                onClick={() => setResolveModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Confirm resolution and record completion in clinical audit log.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
                onClick={() => handleResolveAlert(selectedRequestId)}
              >
                Confirm &amp; Resolve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register New Patient */}
      {registerPatientModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Register New Patient</h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setRegisterPatientModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRegisterPatientSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Patient Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mary Johnson"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={newPatientDob}
                    onChange={(e) => setNewPatientDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robert Johnson (Son)"
                    value={newPatientContactName}
                    onChange={(e) => setNewPatientContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Emergency Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 555-0199"
                    value={newPatientContactPhone}
                    onChange={(e) => setNewPatientContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Patient 4-Digit Tablet PIN *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="1234"
                  value={newPatientPin}
                  onChange={(e) => setNewPatientPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono tracking-widest"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  The patient will enter this PIN on the tablet kiosk to access their regimen.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Medical Diagnoses (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Type 2 Diabetes"
                  value={newPatientConditions}
                  onChange={(e) => setNewPatientConditions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Known Allergies (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Aspirin"
                  value={newPatientAllergies}
                  onChange={(e) => setNewPatientAllergies(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRegisterPatientModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  {isPending ? 'Registering...' : 'Register Patient'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Prescribe Medication */}
      {addMedModalOpen && currentPatient && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-med-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="add-med-modal-title" className="text-xl font-bold text-slate-900">
                Prescribe Medication for {currentPatient.name}
              </h3>
              <button
                type="button"
                aria-label="Close prescription dialog"
                onClick={() => setAddMedModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
                  placeholder="e.g. Lisinopril / Metformin"
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
                    placeholder="e.g. 10 mg / 500 mg"
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
                    onChange={(e) => setMedForm(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  >
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="DROPS">Drops</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Schedule Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 08:00 AM"
                  value={medTime}
                  onChange={(e) => setMedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Instructions / Food Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with morning meal and water"
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddMedModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  {isPending ? 'Prescribing...' : 'Prescribe Medication'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE DOCTOR VISIT MODAL */}
      {scheduleModalOpen && currentPatient && (
        <div role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="schedule-modal-title" className="text-xl font-bold text-slate-900">
                Schedule Doctor Visit for {currentPatient.name}
              </h3>
              <button
                type="button"
                aria-label="Close schedule dialog"
                onClick={() => setScheduleModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleAppointmentSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Physician / Specialist Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Vance, MD"
                  value={apptDoctorName}
                  onChange={(e) => setApptDoctorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Clinic / Hospital Facility *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Jude Heart & Vascular Centre"
                  value={apptClinic}
                  onChange={(e) => setApptClinic(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Scheduled Date &amp; Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thursday, 10:30 AM"
                  value={apptDateTime}
                  onChange={(e) => setApptDateTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Preparation / Clinical Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fast for 8 hours prior to blood test"
                  value={apptNotes}
                  onChange={(e) => setApptNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScheduleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  {isPending ? 'Scheduling...' : 'Confirm Appointment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
