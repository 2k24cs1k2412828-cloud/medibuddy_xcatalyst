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
} from 'lucide-react';
import { registerPatient } from '@/lib/actions/patient.actions';

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  caregiver: string;
  familyContact: string;
  status: 'ACTIVE' | 'ARCHIVED';
  adherence: number;
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

const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Robert Chen',
    age: 78,
    gender: 'MALE',
    caregiver: 'Nurse Sarah Jenkins',
    familyContact: 'David Chen (Son)',
    status: 'ACTIVE',
    adherence: 92,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Margaret Taylor',
    age: 82,
    gender: 'FEMALE',
    caregiver: 'Nurse Sarah Jenkins',
    familyContact: 'Emily Taylor (Daughter)',
    status: 'ACTIVE',
    adherence: 75,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Harold Kumar',
    age: 74,
    gender: 'MALE',
    caregiver: 'Nurse Michael Chang',
    familyContact: 'Sunita Kumar (Wife)',
    status: 'ACTIVE',
    adherence: 100,
  },
];

const INITIAL_AUDITS: AuditRecord[] = [
  {
    id: 'aud-01',
    time: '2 mins ago',
    actor: 'Robert Chen',
    role: 'PATIENT',
    action: 'STATUS_CHANGE',
    entity: 'DOSE',
    details: 'Marked Atorvastatin 20mg as TAKEN via kiosk interface',
  },
  {
    id: 'aud-02',
    time: '18 mins ago',
    actor: 'Nurse Sarah Jenkins',
    role: 'CARETAKER',
    action: 'UPDATE',
    entity: 'ASSISTANCE',
    details: 'Resolved refill assistance request for patient Robert Chen',
  },
  {
    id: 'aud-03',
    time: '1 hour ago',
    actor: 'SYSTEM_CRON',
    role: 'SYSTEM',
    action: 'CREATE',
    entity: 'NOTIFICATION',
    details: 'Dispatched UPCOMING_DOSE notification lease for 3 patients',
  },
  {
    id: 'aud-04',
    time: '2 hours ago',
    actor: 'Dr. Eleanor Vance',
    role: 'ADMIN',
    action: 'CREATE',
    entity: 'APPOINTMENT',
    details: 'Created cardiology evaluation appointment for Robert Chen',
  },
];

export function AdminDashboardClient() {
  const [isPending, startTransition] = useTransition();
  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS);
  const [audits, setAudits] = useState<AuditRecord[]>(INITIAL_AUDITS);
  const [filterEntity, setFilterEntity] = useState<string>('ALL');

  // Register Patient Modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('1950-01-01');
  const [newPatientGender, setNewPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [newPatientContactName, setNewPatientContactName] = useState('');
  const [newPatientContactPhone, setNewPatientContactPhone] = useState('');

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'CARETAKER' | 'FAMILY'>('CARETAKER');

  // Notice
  const [notice, setNotice] = useState<string | null>(null);

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientContactName) return;

    const birthYear = new Date(newPatientDob).getFullYear();
    const age = new Date().getFullYear() - birthYear;

    const newRecord: PatientRecord = {
      id: `patient-${Date.now()}`,
      name: newPatientName,
      age: isNaN(age) ? 75 : age,
      gender: newPatientGender,
      caregiver: 'Nurse Sarah Jenkins',
      familyContact: newPatientContactName,
      status: 'ACTIVE',
      adherence: 100,
    };

    setPatients((prev) => [newRecord, ...prev]);

    // Append to audits
    const newAudit: AuditRecord = {
      id: `aud-${Date.now()}`,
      time: 'Just now',
      actor: 'Dr. Eleanor Vance',
      role: 'ADMIN',
      action: 'CREATE',
      entity: 'ACCESS',
      details: `Registered new patient profile for ${newPatientName}`,
    };
    setAudits((prev) => [newAudit, ...prev]);

    setRegisterModalOpen(false);
    setNotice(`Patient "${newPatientName}" successfully registered.`);
    setTimeout(() => setNotice(null), 5000);

    startTransition(async () => {
      await registerPatient({
        fullName: newPatientName,
        dob: newPatientDob,
        gender: newPatientGender,
        emergencyContactName: newPatientContactName,
        emergencyContactPhone: newPatientContactPhone || '+1 (555) 000-0000',
        medicalConditions: ['Under Clinical Assessment'],
        allergies: [],
      });
    });
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteModalOpen(false);
    setNotice(`Invitation sent to ${inviteEmail} (${inviteRole}).`);
    setTimeout(() => setNotice(null), 5000);

    const newAudit: AuditRecord = {
      id: `aud-${Date.now()}`,
      time: 'Just now',
      actor: 'Dr. Eleanor Vance',
      role: 'ADMIN',
      action: 'CREATE',
      entity: 'ACCESS',
      details: `Sent invitation to ${inviteEmail} as ${inviteRole}`,
    };
    setAudits((prev) => [newAudit, ...prev]);
  };

  const filteredAudits =
    filterEntity === 'ALL'
      ? audits
      : audits.filter((a) => a.entity === filterEntity);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <WelcomeSection userName="Dr. Eleanor Vance" role="ADMIN" />

      {/* Action Notice */}
      {notice && (
        <div className="p-4 rounded-xl bg-teal-800 text-white font-bold text-base flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="p-1 hover:bg-teal-900 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          label="Registered Patients"
          value={String(patients.length)}
          change="+1 this week"
          trend="up"
          iconName="Users"
          variant="default"
        />
        <DashboardStatCard
          label="Active Caretakers"
          value="14"
          subtitle="Verified clinical caregivers"
          iconName="HeartHandshake"
          variant="info"
        />
        <DashboardStatCard
          label="Connected Family Members"
          value="32"
          subtitle="Authorized care circles"
          iconName="Users"
          variant="success"
        />
        <DashboardStatCard
          label="Security Audits Logged"
          value={String(1420 + audits.length - INITIAL_AUDITS.length)}
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
                    <p className="text-xs text-slate-500 mt-1">
                      Assigned: <span className="font-semibold text-slate-700">{p.caregiver}</span>{' '}
                      &bull; Family: <span className="text-slate-600">{p.familyContact}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={p.adherence >= 90 ? 'success' : 'warning'}>
                      {p.adherence}% Adherence
                    </Badge>
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                      Manage &rarr;
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
          </CardContent>
        </Card>
      </div>

      {/* REGISTER NEW PATIENT MODAL */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Register New Patient Profile</h3>
              <button onClick={() => setRegisterModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
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

      {/* INVITE CAREGIVER / FAMILY MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Invite Care Circle Member</h3>
              <button onClick={() => setInviteModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSendInvite} className="space-y-3.5">
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

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'CARETAKER' | 'FAMILY')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                >
                  <option value="CARETAKER">Clinical Caretaker</option>
                  <option value="FAMILY">Family Member</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white font-semibold">
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
