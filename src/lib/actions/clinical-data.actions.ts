'use server';

import { dataStore, PatientRecord, MedicationRecord, AppointmentRecord, AssistanceRecord, EncouragementRecord, AuditRecord } from '@/lib/data/store';
import { getTrustedActorContext } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';

// --- CARETAKER ACTIONS ---

export async function getCaretakerDashboardData(): Promise<{
  patients: PatientRecord[];
  activePatient: PatientRecord | null;
  medications: MedicationRecord[];
  appointments: AppointmentRecord[];
  assistanceRequests: AssistanceRecord[];
  actorName: string;
}> {
  const actor = await getTrustedActorContext();
  const actorName = actor?.name || 'Caregiver';
  const patients = dataStore.getPatients(actor?.userId);
  const activePatient = patients.length > 0 ? patients[0] : null;
  const medications = patients.flatMap((p) => dataStore.getMedications(p.id));
  const appointments = patients.flatMap((p) => dataStore.getAppointments(p.id));
  const assistanceRequests = dataStore.getAssistanceRequests();

  return {
    patients,
    activePatient,
    medications,
    appointments,
    assistanceRequests: assistanceRequests.filter((r) => r.status === 'OPEN'),
    actorName,
  };
}

export async function registerNewPatient(formData: {
  fullName: string;
  dob: string;
  gender: string;
  bloodGroup?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalConditions: string[];
  allergies: string[];
  pin?: string;
  loginEmail?: string;
  loginPassword?: string;
  caretakerUserId?: string;
}) {
  const actor = await getTrustedActorContext();
  const assignedCaretaker = formData.caretakerUserId || (actor?.role === 'CARETAKER' ? actor?.userId : undefined);
  const patient = dataStore.addPatient({
    ...formData,
    caretakerUserId: assignedCaretaker,
  });

  revalidatePath('/caretaker');
  revalidatePath('/admin');
  revalidatePath('/patient');
  return { success: true, patient };
}

export async function prescribeMedication(formData: {
  patientId: string;
  name: string;
  dosage: string;
  form: string;
  schedule: string;
  mealInstruction?: string;
}) {
  const med = dataStore.addMedication(formData);
  revalidatePath('/caretaker');
  revalidatePath('/patient');
  revalidatePath('/family');
  return { success: true, medication: med };
}

export async function scheduleAppointment(formData: {
  patientId: string;
  doctorName: string;
  clinic: string;
  scheduledAt: string;
  visitType?: string;
  notes?: string;
}) {
  const appt = dataStore.addAppointment(formData);
  revalidatePath('/caretaker');
  revalidatePath('/patient');
  revalidatePath('/family');
  return { success: true, appointment: appt };
}

export async function resolveAssistance(requestId: string) {
  const resolved = dataStore.resolveAssistanceRequest(requestId);
  revalidatePath('/caretaker');
  revalidatePath('/patient');
  return { success: true, request: resolved };
}

// --- PATIENT KIOSK ACTIONS ---

export async function getPatientKioskData(targetPatientId?: string): Promise<{
  patient: PatientRecord | null;
  medications: MedicationRecord[];
  appointments: AppointmentRecord[];
  encouragements: EncouragementRecord[];
}> {
  const actor = await getTrustedActorContext();
  let patientId = targetPatientId || actor?.patientId;

  if (!patientId) {
    const all = dataStore.getPatients();
    if (all.length > 0) patientId = all[0].id;
  }

  const patient = patientId ? dataStore.getPatientById(patientId) || null : null;
  const medications = patientId ? dataStore.getMedications(patientId) : [];
  const appointments = patientId ? dataStore.getAppointments(patientId) : [];
  const encouragements = patientId ? dataStore.getEncouragements(patientId) : [];

  return {
    patient,
    medications,
    appointments,
    encouragements,
  };
}

export async function updateDoseStatus(
  medicationId: string,
  status: 'TAKEN' | 'SKIPPED',
  skipReason?: string
) {
  const updated = dataStore.updateMedicationStatus(medicationId, status, skipReason);
  revalidatePath('/patient');
  revalidatePath('/caretaker');
  revalidatePath('/family');
  return { success: Boolean(updated), medication: updated };
}

export async function triggerEmergencySos(patientId: string, message: string = 'Emergency SOS pressed by patient') {
  const req = dataStore.createAssistanceRequest({
    patientId,
    type: 'EMERGENCY_SOS',
    message,
  });
  revalidatePath('/patient');
  revalidatePath('/caretaker');
  revalidatePath('/family');
  return { success: true, request: req };
}

// --- FAMILY CIRCLE ACTIONS ---

export async function getFamilyDashboardData(): Promise<{
  actorName: string;
  patients: PatientRecord[];
  patient: PatientRecord | null;
  medications: MedicationRecord[];
  appointments: AppointmentRecord[];
  encouragements: EncouragementRecord[];
  adherenceRate: number;
}> {
  const actor = await getTrustedActorContext();
  const actorName = actor?.name || 'Family Member';
  const allPatients = dataStore.getPatients();
  const patient = allPatients.length > 0 ? allPatients[0] : null;

  const medications = allPatients.flatMap((p) => dataStore.getMedications(p.id));
  const appointments = allPatients.flatMap((p) => dataStore.getAppointments(p.id));
  const encouragements = patient ? dataStore.getEncouragements(patient.id) : [];

  const patientMeds = patient ? medications.filter((m) => m.patientId === patient.id) : [];
  const taken = patientMeds.filter((m) => m.status === 'TAKEN').length;
  const totalDecided = patientMeds.filter((m) => m.status === 'TAKEN' || m.status === 'SKIPPED').length;
  const adherenceRate = totalDecided === 0 ? 100 : Math.round((taken / totalDecided) * 100);

  return {
    actorName,
    patients: allPatients,
    patient,
    medications: patientMeds,
    appointments: patient ? appointments.filter((a) => a.patientId === patient.id) : [],
    encouragements,
    adherenceRate,
  };
}

export async function sendFamilyEncouragement(patientId: string, message: string) {
  const actor = await getTrustedActorContext();
  const fromName = actor?.name || 'Family Member';
  const rec = dataStore.sendEncouragement({
    patientId,
    fromName,
    message,
  });
  revalidatePath('/family');
  revalidatePath('/patient');
  return { success: true, encouragement: rec };
}

// --- ADMIN ACTIONS ---

export async function getAdminDashboardData(): Promise<{
  actorName: string;
  totalUsers: number;
  totalPatients: number;
  caretakersCount: number;
  familyCount: number;
  caretakers: Array<{ id: string; name: string; email: string }>;
  familyMembers: Array<{ id: string; name: string; email: string }>;
  patients: PatientRecord[];
  audits: AuditRecord[];
}> {
  const actor = await getTrustedActorContext();
  const actorName = actor?.name || 'Administrator';
  const patients = dataStore.getPatients();
  const allUsers = dataStore.getAllUsers();
  const caretakers = allUsers
    .filter((u) => u.role === 'CARETAKER')
    .map((u) => ({ id: u.id, name: u.fullName, email: u.email }));
  const familyMembers = allUsers
    .filter((u) => u.role === 'FAMILY')
    .map((u) => ({ id: u.id, name: u.fullName, email: u.email }));
  const audits = dataStore.getAuditLogs(60);

  return {
    actorName,
    totalUsers: allUsers.length,
    totalPatients: patients.length,
    caretakersCount: caretakers.length,
    familyCount: familyMembers.length,
    caretakers,
    familyMembers,
    patients,
    audits,
  };
}

export async function adminCreateUserAndAssign(formData: {
  fullName: string;
  email: string;
  password: string;
  role: 'CARETAKER' | 'FAMILY';
  patientId?: string;
}) {
  const account = dataStore.registerUser({
    fullName: formData.fullName,
    email: formData.email,
    password: formData.password,
    role: formData.role,
    patientId: formData.patientId,
  });

  if (formData.patientId) {
    if (formData.role === 'CARETAKER') {
      dataStore.assignCaretakerToPatient(formData.patientId, account.id);
    } else if (formData.role === 'FAMILY') {
      dataStore.assignFamilyToPatient(formData.patientId, account.id);
    }
  }

  revalidatePath('/admin');
  revalidatePath('/caretaker');
  revalidatePath('/family');
  return { success: true, user: account };
}

export async function adminAssignPatientAccess(
  patientId: string,
  caretakerUserId?: string,
  familyUserId?: string
) {
  if (caretakerUserId) {
    dataStore.assignCaretakerToPatient(patientId, caretakerUserId);
  }
  if (familyUserId) {
    dataStore.assignFamilyToPatient(patientId, familyUserId);
  }
  revalidatePath('/admin');
  revalidatePath('/caretaker');
  revalidatePath('/family');
  return { success: true };
}

export async function adminUpdatePatientCredentials(
  patientId: string,
  pin?: string,
  loginPassword?: string
) {
  const updated = dataStore.updatePatientCredentials(patientId, pin, loginPassword);
  revalidatePath('/admin');
  revalidatePath('/patient');
  return { success: updated };
}

export async function familyLinkToPatient(patientId: string, pin?: string) {
  const actor = await getTrustedActorContext();
  if (!actor || !actor.userId) return { success: false, error: 'Unauthorized session' };

  const patient = dataStore.getPatientById(patientId);
  if (!patient) return { success: false, error: 'Patient not found' };

  if (pin && patient.pin !== pin) {
    return { success: false, error: 'Incorrect 4-digit Patient PIN verification.' };
  }

  dataStore.assignFamilyToPatient(patientId, actor.userId);
  revalidatePath('/family');
  return { success: true, patient };
}
