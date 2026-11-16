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
  const medications = activePatient ? dataStore.getMedications(activePatient.id) : [];
  const appointments = activePatient ? dataStore.getAppointments(activePatient.id) : [];
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
}) {
  const actor = await getTrustedActorContext();
  const patient = dataStore.addPatient({
    ...formData,
    caretakerUserId: actor?.userId,
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

  const medications = patient ? dataStore.getMedications(patient.id) : [];
  const appointments = patient ? dataStore.getAppointments(patient.id) : [];
  const encouragements = patient ? dataStore.getEncouragements(patient.id) : [];

  const taken = medications.filter((m) => m.status === 'TAKEN').length;
  const totalDecided = medications.filter((m) => m.status === 'TAKEN' || m.status === 'SKIPPED').length;
  const adherenceRate = totalDecided === 0 ? 100 : Math.round((taken / totalDecided) * 100);

  return {
    actorName,
    patient,
    medications,
    appointments,
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
  patients: PatientRecord[];
  audits: AuditRecord[];
}> {
  const actor = await getTrustedActorContext();
  const actorName = actor?.name || 'Administrator';
  const patients = dataStore.getPatients();
  const totalUsers = dataStore.getAllUsers().length;
  const audits = dataStore.getAuditLogs(60);

  return {
    actorName,
    totalUsers,
    totalPatients: patients.length,
    patients,
    audits,
  };
}
