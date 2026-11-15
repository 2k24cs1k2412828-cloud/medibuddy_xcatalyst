'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTrustedActorContext, assertPatientPermission } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';

export type AppointmentActionResult = { success: boolean; error?: string };

/**
 * Patient acknowledges an upcoming appointment.
 * Enforces the strict transition: SCHEDULED -> ACKNOWLEDGED.
 * Authenticates caller and prevents cross-patient manipulation.
 */
export async function acknowledgeAppointment(
  appointmentId: string
): Promise<AppointmentActionResult> {
  try {
    const actor = await getTrustedActorContext();
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required.' };
    }

    const supabase = await createServerSupabaseClient();

    // 1. Fetch appointment record to check ownership and state
    const { data: apt } = await supabase
      .from('appointments')
      .select('id, patient_id, status')
      .eq('id', appointmentId)
      .single();

    const targetPatientId = apt?.patient_id || actor.patientId;
    if (!targetPatientId) {
      return { success: false, error: 'Appointment record not found or patient context missing.' };
    }

    // 2. Validate permission
    const authCheck = await assertPatientPermission(actor, targetPatientId, 'can_acknowledge_appointments');
    if (!authCheck.allowed) {
      return { success: false, error: authCheck.reason || 'Forbidden: Insufficient permissions.' };
    }

    // 3. State machine guard: Patients can only acknowledge SCHEDULED visits
    if (apt && apt.status !== 'SCHEDULED' && apt.status !== 'ACKNOWLEDGED') {
      return { success: false, error: `Cannot acknowledge an appointment with status: ${apt.status}` };
    }

    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'ACKNOWLEDGED' as const,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .eq('status', 'SCHEDULED');

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/patient');
    revalidatePath('/caretaker');
    revalidatePath('/family');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Fetch appointments for a given patient.
 */
export async function getPatientAppointments(patientId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', patientId)
    .order('appointment_date', { ascending: true });

  return { data: data ?? [], error };
}

/**
 * Caretaker or Admin schedules a new appointment.
 * Strictly forbidden for Patient or Family roles.
 */
export async function createAppointment(formData: {
  patientId: string;
  title: string;
  doctorName: string;
  specialty?: string;
  clinicHospital: string;
  locationAddress?: string;
  appointmentDate: string;
  instructions?: string;
}): Promise<AppointmentActionResult> {
  try {
    const actor = await getTrustedActorContext();
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required.' };
    }

    // Enforce that only Caretakers and Admins can create clinic appointments
    const authCheck = await assertPatientPermission(actor, formData.patientId, 'can_manage_appointments');
    if (!authCheck.allowed) {
      return {
        success: false,
        error: authCheck.reason || 'Forbidden: Only caretakers and administrators can schedule appointments.',
      };
    }

    if (!formData.title || !formData.doctorName || !formData.appointmentDate) {
      return { success: false, error: 'Title, Doctor name, and Date are required.' };
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from('appointments').insert({
      patient_id: formData.patientId,
      title: formData.title,
      doctor_name: formData.doctorName,
      specialty: formData.specialty ?? null,
      clinic_hospital: formData.clinicHospital,
      location_address: formData.locationAddress ?? null,
      appointment_date: formData.appointmentDate,
      instructions: formData.instructions ?? null,
      status: 'SCHEDULED' as const,
      assistance_requested: false,
      created_by: actor.userId || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/caretaker');
    revalidatePath('/patient');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
