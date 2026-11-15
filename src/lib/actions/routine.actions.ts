'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTrustedActorContext, assertPatientPermission } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';

export type RoutineActionResult = { success: boolean; error?: string };

/**
 * Log daily routine completion status (Hydration, Exercise, etc.)
 */
export async function toggleRoutineLog(
  routineId: string,
  patientId: string,
  completed: boolean
): Promise<RoutineActionResult> {
  try {
    const actor = await getTrustedActorContext();
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required.' };
    }

    const authCheck = await assertPatientPermission(actor, patientId, 'can_view_routines');
    if (!authCheck.allowed) {
      return { success: false, error: authCheck.reason || 'Forbidden: Insufficient permissions.' };
    }

    const supabase = await createServerSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('routine_logs').upsert(
      {
        routine_id: routineId,
        patient_id: patientId,
        log_date: today,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      } as any,
      { onConflict: 'routine_id,patient_id,log_date' }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/patient');
    revalidatePath('/caretaker');
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Fetch active routines and today's logs for a patient.
 */
export async function getTodayRoutines(patientId: string) {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: routines, error: routinesError } = await supabase
    .from('healthcare_routines')
    .select('*')
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .order('target_time', { ascending: true });

  const { data: logs, error: logsError } = await supabase
    .from('routine_logs')
    .select('*')
    .eq('patient_id', patientId)
    .eq('log_date', today);

  return {
    routines: routines ?? [],
    logs: logs ?? [],
    error: routinesError || logsError,
  };
}
