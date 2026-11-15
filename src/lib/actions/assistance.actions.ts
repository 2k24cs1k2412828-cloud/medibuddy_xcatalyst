'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTrustedActorContext, assertPatientPermission } from '@/lib/auth/permissions';
import { queueNotification } from '@/lib/email/notification-scheduler';
import { revalidatePath } from 'next/cache';

export type AssistanceActionResult = { success: boolean; error?: string };

/**
 * Patient or Family creates an assistance request (Refill, Schedule, Emergency/SOS).
 */
export async function createAssistanceRequest(
  patientId: string,
  category:
    | 'MEDICATION_CLARIFICATION'
    | 'UNAVAILABLE_MEDICINE'
    | 'APPOINTMENT_HELP'
    | 'SCHEDULE_CHANGE'
    | 'EMERGENCY_HELP'
    | 'GENERAL_CARE',
  urgency: 'NORMAL' | 'URGENT',
  message: string
): Promise<AssistanceActionResult> {
  try {
    const actor = await getTrustedActorContext();
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required.' };
    }

    const authCheck = await assertPatientPermission(actor, patientId, 'can_create_assistance');
    if (!authCheck.allowed) {
      return { success: false, error: authCheck.reason || 'Forbidden: Insufficient permissions.' };
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from('assistance_requests').insert({
      patient_id: patientId,
      category,
      urgency,
      message,
      status: 'OPEN' as const,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Queue priority notification alert for clinical care circle
    try {
      const isUrgent = urgency === 'URGENT';
      const eventId = `event_assist_${patientId.slice(0, 8)}_${Date.now()}`;
      await queueNotification({
        patientId,
        recipientEmail: 'sarah.jenkins@hospital.org',
        notificationType: 'ASSISTANCE_ALERT',
        subject: isUrgent
          ? `🚨 URGENT Patient Alert: Emergency Help Request`
          : `Patient Assistance Request: ${category.replace('_', ' ')}`,
        messageSnippet: message,
        eventIdentifier: eventId,
        urgency,
      });
    } catch {
      // Notification queue failure shouldn't block user assistance ticket creation
    }

    revalidatePath('/patient');
    revalidatePath('/caretaker');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Caretaker or Admin resolves an assistance request.
 * Strictly forbidden for Patient or Family roles.
 */
export async function resolveAssistanceRequest(
  requestId: string,
  resolutionNotes: string
): Promise<AssistanceActionResult> {
  try {
    const actor = await getTrustedActorContext();
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required.' };
    }

    const supabase = await createServerSupabaseClient();

    // 1. Fetch request to check patient isolation
    const { data: req } = await supabase
      .from('assistance_requests')
      .select('id, patient_id')
      .eq('id', requestId)
      .single();

    if (!req) {
      return { success: false, error: 'Assistance request not found.' };
    }
    const targetPatientId = req.patient_id;

    // 2. Enforce permission: only Caretakers and Admins can resolve assistance requests
    const authCheck = await assertPatientPermission(actor, targetPatientId, 'can_resolve_assistance');
    if (!authCheck.allowed) {
      return {
        success: false,
        error: authCheck.reason || 'Forbidden: Only caretakers and administrators can resolve assistance tickets.',
      };
    }

    const { error } = await supabase
      .from('assistance_requests')
      .update({
        status: 'RESOLVED' as const,
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
        resolved_by: actor.userId || null,
      })
      .eq('id', requestId);

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

/**
 * Fetch open assistance requests for a patient.
 */
export async function getPatientAssistanceRequests(patientId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('assistance_requests')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}
