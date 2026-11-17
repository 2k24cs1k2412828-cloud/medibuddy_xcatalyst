'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WelcomeSection } from '@/components/dashboard/welcome-section';
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card';
import {
  UserPlus,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  X,
  Filter,
  KeyRound,
  Copy,
  Check,
  Settings,
  HeartHandshake,
} from 'lucide-react';
import {
  registerNewPatient,
  adminCreateUserAndAssign,
  adminAssignPatientAccess,
  adminUpdatePatientCredentials,
} from '@/lib/actions/clinical-data.actions';

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  caregiver: string;
  caregiverUserId?: string;
  familyContact: string;
  familyNames?: string[];
  status: 'ACTIVE' | 'ARCHIVED';
  adherence: number;
  pin: string;
  loginEmail: string;
  loginPassword: string;
}

interface AuditRecord {
  id: string;
  time: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  details: string;
}

export interface AdminDashboardProps {
  initialData?: {
    actorName: string;
    totalUsers: number;
    totalPatients: number;
    caretakersCount?: number;
    familyCount?: number;
    caretakers?: Array<{ id: string; name: string; email: string }>;
    familyMembers?: Array<{ id: string; name: string; email: string }>;
    patients: any[];
    audits: any[];
  };
}

export function AdminDashboardClient({ initialData }: AdminDashboardProps) {
  const [isPending, startTransition] = useTransition();

  const mappedPatients: PatientRecord[] = (initialData?.patients || []).map((p: any) => ({
    id: p.id,
    name: p.fullName || p.name,
    age: p.age || 75,
    gender: p.gender || 'OTHER',
    caregiver: p.caretakerName || 'Unassigned (Awaiting Caregiver)',
    caregiverUserId: p.caretakerUserId,
    familyContact: p.emergencyContactName || 'Family Contact',
    familyNames: p.familyNames || [],
    status: 'ACTIVE',
    adherence: p.adherenceRate ?? 100,
    pin: p.pin || '1234',
    loginEmail: p.loginEmail || `patient.${(p.fullName || '').toLowerCase().replace(/[^a-z0-9]/g, '')}@medicareconnect.com`,
    loginPassword: p.loginPassword || 'medicare123',
  }));

  const mappedAudits: AuditRecord[] = (initialData?.audits || []).map((a: any) => ({
    id: a.id,
    time: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actor: a.actor,
    role: a.role,
    action: a.action,
    entity: a.target,
    details: a.details,
  }));

  const [patients, setPatients] = useState<PatientRecord[]>(mappedPatients);
  const [audits, setAudits] = useState<AuditRecord[]>(mappedAudits);
  const [filterEntity, setFilterEntity] = useState<string>('ALL');

  // Register Patient Modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('1950-01-01');
  const [newPatientGender, setNewPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [newPatientContactName, setNewPatientContactName] = useState('');
  const [newPatientContactPhone, setNewPatientContactPhone] = useState('');
  const [newPatientPin, setNewPatientPin] = useState('1234');
  const [newPatientCaretakerId, setNewPatientCaretakerId] = useState('');

  // Manage Patient Access Modal
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [managingPatient, setManagingPatient] = useState<PatientRecord | null>(null);
  const [managePin, setManagePin] = useState('');
  const [managePassword, setManagePassword] = useState('');
  const [manageCaretakerId, setManageCaretakerId] = useState('');
  const [manageFamilyId, setManageFamilyId] = useState('');

  // Created Patient Credentials Pop-up
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    pin: string;
    email: string;
    password: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('caregiver123');
  const [inviteRole, setInviteRole] = useState<'CARETAKER' | 'FAMILY'>('CARETAKER');
  const [invitePatientId, setInvitePatientId] = useState('');

  // Notice
  const [notice, setNotice] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 3000);
  };

  const handleOpenManagePatient = (patient: PatientRecord) => {
    setManagingPatient(patient);
    setManagePin(patient.pin);
    setManagePassword(patient.loginPassword);
    setManageCaretakerId(patient.caregiverUserId || '');
    setManageFamilyId('');
    setManageModalOpen(true);
  };

  const handleSaveManagePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingPatient) return;

    const updatedCaretaker = (initialData?.caretakers || []).find((c) => c.id === manageCaretakerId);
    const updatedFamily = (initialData?.familyMembers || []).find((f) => f.id === manageFamilyId);

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== managingPatient.id) return p;
        const familyNames = [...(p.familyNames || [])];
        if (updatedFamily && !familyNames.includes(updatedFamily.name)) {
          familyNames.push(updatedFamily.name);
        }
        return {
          ...p,
          pin: managePin || p.pin,
          loginPassword: managePassword || p.loginPassword,
          caregiver: updatedCaretaker?.name || p.caregiver,
          caregiverUserId: manageCaretakerId || p.caregiverUserId,
          familyNames,
        };
      })
    );

    setManageModalOpen(false);
    setNotice(`Access & credentials updated for ${managingPatient.name}.`);
    setTimeout(() => setNotice(null), 5000);

    startTransition(async () => {
      await adminUpdatePatientCredentials(managingPatient.id, managePin, managePassword);
      if (manageCaretakerId || manageFamilyId) {
        await adminAssignPatientAccess(managingPatient.id, manageCaretakerId || undefined, manageFamilyId || undefined);
      }
    });
  };

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientContactName) return;

    const birthYear = new Date(newPatientDob).getFullYear();
    const age = new Date().getFullYear() - birthYear;
    const cleanUsername = newPatientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'patient';
    const pin = newPatientPin || '1234';
    const loginEmail = `patient.${cleanUsername}@medicareconnect.com`;
    const loginPassword = 'medicare123';

    const selectedCaretaker = (initialData?.caretakers || []).find((c) => c.id === newPatientCaretakerId);

    const newRecord: PatientRecord = {
      id: `patient-${Date.now()}`,
      name: newPatientName,
      age: isNaN(age) ? 75 : age,
      gender: newPatientGender,
      caregiver: selectedCaretaker?.name || 'Unassigned (Awaiting Caregiver)',
      caregiverUserId: newPatientCaretakerId || undefined,
      familyContact: newPatientContactName,
      familyNames: [],
      status: 'ACTIVE',
      adherence: 100,
      pin,
      loginEmail,
      loginPassword,
    };

    setPatients((prev) => [newRecord, ...prev]);

    // Append to audits
    const newAudit: AuditRecord = {
      id: `aud-${Date.now()}`,
      time: 'Just now',
      actor: initialData?.actorName || 'System Administrator',
      role: 'ADMIN',
      action: 'CREATE',
      entity: 'ACCESS',
      details: `Registered new patient profile for ${newPatientName} (PIN: ${pin}, Login: ${loginEmail})`,
    };
    setAudits((prev) => [newAudit, ...prev]);

    setRegisterModalOpen(false);
    setCreatedCredentials({
      name: newPatientName,
      pin,
      email: loginEmail,
      password: loginPassword,
    });
    setNotice(`Patient "${newPatientName}" registered with Kiosk PIN ${pin} and web login.`);
    setTimeout(() => setNotice(null), 6000);

    startTransition(async () => {
      await registerNewPatient({
        fullName: newPatientName,
        dob: newPatientDob,
        gender: newPatientGender,
        emergencyContactName: newPatientContactName,
        emergencyContactPhone: newPatientContactPhone || '+1 (555) 000-0000',
        medicalConditions: ['Under Clinical Assessment'],
        allergies: [],
        pin,
        loginEmail,
        loginPassword,
        caretakerUserId: newPatientCaretakerId || undefined,
      });
    });

    setNewPatientName('');
    setNewPatientContactName('');
    setNewPatientContactPhone('');
    setNewPatientPin('1234');
    setNewPatientCaretakerId('');
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const tempPassword = invitePassword || 'caregiver123';
    setInviteModalOpen(false);
    setNotice(`Account for ${inviteName} created successfully (${inviteRole})! Log in with ${inviteEmail}`);
    setTimeout(() => setNotice(null), 6000);

    const newAudit: AuditRecord = {
      id: `aud-${Date.now()}`,
      time: 'Just now',
      actor: initialData?.actorName || 'System Administrator',
      role: 'ADMIN',
      action: 'CREATE',
      entity: 'ACCESS',
      details: `Created ${inviteRole} account for ${inviteName} (${inviteEmail})`,
    };
    setAudits((prev) => [newAudit, ...prev]);

    startTransition(async () => {
      await adminCreateUserAndAssign({
        fullName: inviteName,
        email: inviteEmail,
        password: tempPassword,
        role: inviteRole,
        patientId: invitePatientId || undefined,
      });
    });

    setInviteName('');
    setInviteEmail('');
    setInvitePassword('caregiver123');
    setInvitePatientId('');
  };

  const filteredAudits =
    filterEntity === 'ALL'
      ? audits
      : audits.filter((a) => a.entity === filterEntity);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <WelcomeSection userName={initialData?.actorName || "System Administrator"} role="ADMIN" />

      {/* Action Notice */}
      {notice && (
        <div role="status" aria-live="polite" className="p-4 rounded-xl bg-teal-800 text-white font-bold text-base flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss notice"
            onClick={() => setNotice(null)}
            className="h-11 w-11 flex items-center justify-center hover:bg-teal-900 rounded-lg text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          label="Registered Patients"
          value={String(patients.length)}
          change={`${patients.length} active`}
          trend="up"
          iconName="Users"
          variant="default"
        />
        <DashboardStatCard
          label="Active Caretakers"
          value={String(initialData?.caretakersCount ?? 1)}
          subtitle="Verified clinical caregivers"
          iconName="HeartHandshake"
          variant="info"
        />
        <DashboardStatCard
          label="Connected Family Members"
          value={String(initialData?.familyCount ?? 0)}
          subtitle="Authorized care circles"
          iconName="Users"
          variant="success"
        />
        <DashboardStatCard
          label="Security Audits Logged"
          value={String(audits.length)}
          subtitle="Append-only verified"
          iconName="ShieldAlert"
          variant="default"
        />
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">Administrative Operations</h2>
          <p className="text-xs text-slate-500">
            Create patient healthcare profiles, invite caregivers, and configure role-based permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs"
            onClick={() => setRegisterModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Register New Patient</span>
          </Button>
          <Button
            variant="outline"
            className="font-semibold"
            onClick={() => setInviteModalOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Invite Caretaker / Family</span>
          </Button>
        </div>
      </div>

      {/* Two-Column Management Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Registry Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold">Patient Registry</CardTitle>
              <CardDescription>
                Elderly individuals actively monitored under MediCare Connect
              </CardDescription>
            </div>
            <Badge variant="default">{patients.length} Profiles</Badge>
          </CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700 text-sm">No patients registered in the clinical registry yet.</p>
                <p className="text-xs text-slate-500">Click &ldquo;Register New Patient&rdquo; above to onboard the first individual.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <div
                    key={p.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{p.name}</span>
                        <span className="text-xs text-slate-500">
                          {p.age} yrs &bull; {p.gender}
                        </span>
                        <Badge variant="success" className="text-[10px] py-0 px-2">
                          {p.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 font-mono bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded border border-teal-200 text-[11px] font-bold">
                          Kiosk PIN: {p.pin}
                        </span>
                        <span className="text-slate-600">
                          Login: <span className="font-mono text-slate-800">{p.loginEmail}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Caregiver: <span className="font-semibold text-slate-700">{p.caregiver}</span>{' '}
                        &bull; Family: <span className="text-slate-600">{p.familyNames && p.familyNames.length > 0 ? p.familyNames.join(', ') : (p.familyContact || 'None linked')}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <Badge variant={p.adherence >= 90 ? 'success' : 'warning'}>
                        {p.adherence}% Adherence
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenManagePatient(p)}
                        className="text-xs font-semibold bg-white border-teal-600 text-teal-800 hover:bg-teal-50"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        <span>Manage &rarr;</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Audit Log Stream */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-700" />
                <span>Security Audit</span>
              </CardTitle>
              <CardDescription>Append-only tamper-proof log</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filter */}
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500 font-semibold">Filter:</span>
              {['ALL', 'DOSE', 'ASSISTANCE', 'NOTIFICATION', 'ACCESS'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterEntity(type)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    filterEntity === type
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {filteredAudits.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No audit events recorded under this filter yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredAudits.map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-800">{a.actor} ({a.role})</span>
                      <span className="text-slate-400 text-[10px]">{a.time}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{a.details}</p>
                    <span className="inline-block px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono text-[9px]">
                      {a.entity} &bull; {a.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* REGISTER NEW PATIENT MODAL */}
      {registerModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="register-patient-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="register-patient-modal-title" className="text-xl font-bold text-slate-900">Register New Patient Profile</h3>
              <button
                type="button"
                aria-label="Close register dialog"
                onClick={() => setRegisterModalOpen(false)}
                className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRegisterPatient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Florence Nightingale"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Date of Birth
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
                    onChange={(e) => setNewPatientGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
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
                    4-Digit Kiosk PIN *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. 1234"
                    value={newPatientPin}
                    onChange={(e) => setNewPatientPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold tracking-widest text-center"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Used by patient on bedside kiosk</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Assign Caregiver
                  </label>
                  <select
                    value={newPatientCaretakerId}
                    onChange={(e) => setNewPatientCaretakerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  >
                    <option value="">Unassigned (Awaiting Caregiver)</option>
                    {(initialData?.caretakers || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-0.5">Primary clinical caregiver</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Primary Emergency Contact (Name &amp; Relation) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. James Smith (Son)"
                  value={newPatientContactName}
                  onChange={(e) => setNewPatientContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={newPatientContactPhone}
                  onChange={(e) => setNewPatientContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setRegisterModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                  disabled={isPending}
                >
                  Create Patient Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT CREDENTIALS POP-UP MODAL */}
      {createdCredentials && (
        <div role="dialog" aria-modal="true" aria-labelledby="creds-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-teal-500 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-800">
                <KeyRound className="h-6 w-6 text-teal-700" />
                <h3 id="creds-modal-title" className="text-xl font-bold text-slate-900">
                  Patient Login Created!
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close credentials dialog"
                onClick={() => setCreatedCredentials(null)}
                className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Share these login details with <strong>{createdCredentials.name}</strong> or their caregiver. The patient can access their portal using either method:
            </p>

            <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block mb-0.5">
                  Method 1: Bedside Patient Kiosk (Touch Keypad)
                </span>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-teal-300">
                  <span className="font-mono text-2xl font-black text-teal-950 tracking-widest">
                    {createdCredentials.pin}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(createdCredentials.pin, 'pin')}
                    className="h-8 px-2 text-xs font-semibold text-teal-700"
                  >
                    {copiedField === 'pin' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-1">{copiedField === 'pin' ? 'Copied' : 'Copy PIN'}</span>
                  </Button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block mb-0.5">
                  Method 2: Web Sign In (Email &amp; Password)
                </span>
                <div className="bg-white p-2.5 rounded-lg border border-teal-300 text-xs space-y-1 font-mono text-slate-800">
                  <div className="flex justify-between items-center">
                    <span>Email: <strong>{createdCredentials.email}</strong></span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                      className="text-teal-700 hover:underline text-[10px]"
                    >
                      {copiedField === 'email' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Password: <strong>{createdCredentials.password}</strong></span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdCredentials.password, 'pass')}
                      className="text-teal-700 hover:underline text-[10px]"
                    >
                      {copiedField === 'pass' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold h-11"
              onClick={() => setCreatedCredentials(null)}
            >
              Done &amp; Close
            </Button>
          </div>
        </div>
      )}

      {/* MANAGE PATIENT ACCESS & CREDENTIALS MODAL */}
      {manageModalOpen && managingPatient && (
        <div role="dialog" aria-modal="true" aria-labelledby="manage-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 id="manage-modal-title" className="text-xl font-bold text-slate-900">
                  Manage Access: {managingPatient.name}
                </h3>
                <p className="text-xs text-slate-500">Configure bedside PIN, web login, and connected care circle.</p>
              </div>
              <button
                type="button"
                aria-label="Close manage dialog"
                onClick={() => setManageModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManagePatient} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-teal-700" />
                  <span>Patient Login Credentials</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Bedside Kiosk PIN
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={managePin}
                      onChange={(e) => setManagePin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Web Portal Password
                    </label>
                    <input
                      type="text"
                      value={managePassword}
                      onChange={(e) => setManagePassword(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono bg-white p-2 rounded border border-slate-200">
                  Web Login ID: <strong>{managingPatient.loginEmail}</strong>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-teal-700" />
                  <span>Care Circle Connections</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Primary Caretaker
                  </label>
                  <select
                    value={manageCaretakerId}
                    onChange={(e) => setManageCaretakerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  >
                    <option value="">Unassigned (Awaiting Caregiver)</option>
                    {(initialData?.caretakers || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Connect Family Member
                  </label>
                  <select
                    value={manageFamilyId}
                    onChange={(e) => setManageFamilyId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  >
                    <option value="">Select a registered family account to link...</option>
                    {(initialData?.familyMembers || []).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.email})
                      </option>
                    ))}
                  </select>
                  {managingPatient.familyNames && managingPatient.familyNames.length > 0 && (
                    <p className="text-[11px] text-teal-700 mt-1 font-semibold">
                      Currently Linked: {managingPatient.familyNames.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setManageModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  Save Access Settings
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE CAREGIVER / FAMILY MODAL */}
      {inviteModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="invite-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="invite-modal-title" className="text-xl font-bold text-slate-900">
                Create &amp; Assign User Account
              </h3>
              <button
                type="button"
                aria-label="Close invite dialog"
                onClick={() => setInviteModalOpen(false)}
                className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSendInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nurse Sarah Jenkins"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'CARETAKER' | 'FAMILY')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                  >
                    <option value="CARETAKER">Caregiver / Nurse</option>
                    <option value="FAMILY">Family Member</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Assign to Patient
                </label>
                <select
                  value={invitePatientId}
                  onChange={(e) => setInvitePatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                >
                  <option value="">Select patient to link...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Age {p.age})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Links this caregiver/family member to monitor and support this patient.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  {isPending ? 'Creating Account...' : 'Create & Assign Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
