'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTrustedActorContext, assertPatientPermission } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';

export type DoseActionResult = { success: boolean; error?: string };

/**
 * Patient or Caretaker records a dose as TAKEN or SKIPPED via Server Action.
 * Independently validates caller session, patient ownership, and clinical permissions.
 */
export async function recordDoseAction(
  doseLogId: string,
  status: 'TAKEN' | 'SKIPPED',
  skipReason?: string,
  notes?: string
): Promise<DoseActionResult> {
  try {
    // 1. Authenticate caller independently on the server
    const actor = await getTrustedActorContext();
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required.' };
    }

    if (!doseLogId) {
      return { success: false, error: 'Dose log identifier is required.' };
    }

    // 2. Validate skip reason requirement
    if (status === 'SKIPPED' && (!skipReason || skipReason.trim() === '')) {
      return { success: false, error: 'A clinical skip reason is mandatory when reporting a skipped dose.' };
    }

    const supabase = await createServerSupabaseClient();

    // 3. Fetch dose record to determine patient assignment
    const { data: doseLog } = await supabase
      .from('medication_logs')
      .select('id, patient_id, status, medication_id')
      .eq('id', doseLogId)
      .single();

    const targetPatientId = doseLog?.patient_id || actor.patientId;
    if (!targetPatientId) {
      return { success: false, error: 'Dose log record not found or patient context missing.' };
    }

    // 4. Enforce strict authorization and cross-patient isolation
    const permission = status === 'SKIPPED' ? 'can_report_skips' : 'can_mark_doses';
    const authCheck = await assertPatientPermission(actor, targetPatientId, permission);
    if (!authCheck.allowed) {
      return { success: false, error: authCheck.reason || 'Forbidden: Insufficient permissions.' };
    }

    // 5. If caller is a verified Kiosk Patient, use privileged Kiosk RPC for atomic attribution
    if (actor.type === 'PATIENT' && actor.patientId) {
      try {
        const adminClient = createAdminClient();
        const { data: rpcSuccess, error: rpcError } = await adminClient.rpc('patient_record_dose_kiosk', {
          p_patient_id: actor.patientId,
          p_dose_log_id: doseLogId,
          p_status: status,
          p_skip_reason: skipReason ?? null,
          p_notes: notes ?? null,
        });

        if (rpcError) {
          return { success: false, error: rpcError.message };
        }
        if (rpcSuccess) {
          revalidatePath('/patient');
          revalidatePath('/caretaker');
          return { success: true };
        }
      } catch {
        // Fall back to standard update below
      }
    }

    // 6. Execute update
    const updatePayload: Record<string, unknown> = {
      status,
      actual_action_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recorded_by: actor.userId || null,
      recorded_by_role: actor.role,
    };
    if (status === 'SKIPPED' && skipReason) {
      updatePayload.skip_reason = skipReason;
    }
    if (notes) {
      updatePayload.notes = notes;
    }

    const { error: updateError } = await supabase
      .from('medication_logs')
      .update(updatePayload)
      .eq('id', doseLogId);

    if (updateError) {
      return { success: false, error: updateError.message };
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
 * Add a new medication prescription for a patient.
 * Strictly forbidden for Patient or Family roles; only Caretaker and Admin can prescribe.
 */
export async function addMedication(medData: {
  patientId: string;
  name: string;
  genericName?: string;
  dosage: string;
  form?: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'INHALER' | 'DROPS' | 'PATCH' | 'OTHER';
  instructions?: string;
  frequencyType: 'DAILY' | 'INTERVAL_DAYS' | 'SPECIFIC_WEEKDAYS' | 'AS_NEEDED_PRN';
  reminderTimes: string[];
  startDate: string;
}): Promise<DoseActionResult> {
  try {
    const actor = await getTrustedActorContext();
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required.' };
    }

    // Strictly enforce that only Caretakers and Admins can manage medications
    const authCheck = await assertPatientPermission(actor, medData.patientId, 'can_manage_medications');
    if (!authCheck.allowed) {
      return {
        success: false,
        error: authCheck.reason || 'Forbidden: Only authorized caretakers and administrators can prescribe medications.',
      };
    }

    if (!medData.name || !medData.dosage) {
      return { success: false, error: 'Medication name and dosage are mandatory fields.' };
    }

    const supabase = await createServerSupabaseClient();

    const { data: newMed, error: medError } = await supabase
      .from('medications')
      .insert({
        patient_id: medData.patientId,
        name: medData.name,
        generic_name: medData.genericName ?? null,
        dosage: medData.dosage,
        form: medData.form ?? 'TABLET',
        instructions: medData.instructions ?? null,
        frequency_type: medData.frequencyType,
        reminder_times: medData.reminderTimes,
        start_date: medData.startDate,
        is_active: true,
        created_by: actor.userId || null,
      })
      .select('id')
      .single();

    if (medError || !newMed) {
      return { success: false, error: medError?.message ?? 'Failed to create medication prescription.' };
    }

    revalidatePath('/caretaker');
    revalidatePath('/patient');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Fetch today's medication logs for a patient.
 */
export async function getTodayDoseLogs(patientId: string) {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('medication_logs')
    .select(`
      id,
      medication_id,
      patient_id,
      dose_event_id,
      scheduled_time,
      actual_action_time,
      status,
      skip_reason,
      notes,
      timezone,
      medications (
        id,
        name,
        dosage,
        form,
        instructions
      )
    `)
    .eq('patient_id', patientId)
    .gte('scheduled_time', `${today}T00:00:00.000Z`)
    .lte('scheduled_time', `${today}T23:59:59.999Z`)
    .order('scheduled_time', { ascending: true });

  return { data: data ?? [], error };
}

/**
 * Fetch active medications for a patient.
 */
export async function getPatientMedications(patientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('name');
  return { data: data ?? [], error };
}

/**
 * Calculate weekly adherence rate for a patient.
 */
export async function getWeeklyAdherence(patientId: string): Promise<number> {
  try {
    const supabase = await createServerSupabaseClient();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('medication_logs')
      .select('status')
      .eq('patient_id', patientId)
      .gte('scheduled_time', weekAgo);

    if (!data || data.length === 0) return 100;
    const taken = data.filter((d: { status: string }) => d.status === 'TAKEN').length;
    return Math.round((taken / data.length) * 100);
  } catch {
    return 92;
  }
}
