-- ==============================================================================
-- MediCare Connect - Migration 006: Secure Stored Procedures & Kiosk RPCs
-- ==============================================================================

-- 1. SECURE PATIENT KIOSK DOSE ACTION RPC
-- Executable strictly by server-side service_role after HMAC session verification
CREATE OR REPLACE FUNCTION public.patient_record_dose_kiosk(
  p_patient_id UUID,
  p_dose_log_id UUID,
  p_status TEXT,
  p_skip_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_med_id UUID;
  v_current_status VARCHAR(20);
  v_is_med_active BOOLEAN;
  v_patient_status VARCHAR(20);
BEGIN
  -- 1. Validate Patient Profile Status
  SELECT status INTO v_patient_status
  FROM public.patient_profiles
  WHERE id = p_patient_id;

  IF NOT FOUND OR v_patient_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Patient profile is inactive or does not exist.';
  END IF;

  -- 2. Validate Dose Ownership & Read Current Status (Patient Isolation Guard)
  SELECT medication_id, status INTO v_med_id, v_current_status
  FROM public.medication_logs
  WHERE id = p_dose_log_id AND patient_id = p_patient_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dose record not found or does not belong to this patient.';
  END IF;

  -- 3. Validate Medication Active Status
  SELECT is_active INTO v_is_med_active
  FROM public.medications
  WHERE id = v_med_id;

  IF NOT FOUND OR NOT v_is_med_active THEN
    RAISE EXCEPTION 'Medication prescription is inactive.';
  END IF;

  -- 4. Validate Allowed State Transitions
  IF v_current_status <> 'PENDING' THEN
    RAISE EXCEPTION 'Only PENDING doses can be marked (current status: %).', v_current_status;
  END IF;

  IF p_status NOT IN ('TAKEN', 'SKIPPED') THEN
    RAISE EXCEPTION 'Invalid dose action status: %.', p_status;
  END IF;

  IF p_status = 'SKIPPED' AND (p_skip_reason IS NULL OR trim(p_skip_reason) = '') THEN
    RAISE EXCEPTION 'Skip reason is mandatory when reporting a skipped dose.';
  END IF;

  -- Execute Atomic Update
  UPDATE public.medication_logs
  SET 
    status = p_status,
    skip_reason = p_skip_reason,
    notes = p_notes,
    actual_action_time = NOW(),
    recorded_by = NULL,
    recorded_by_role = 'PATIENT',
    updated_at = NOW()
  WHERE id = p_dose_log_id;

  -- 5. Audit Logging with Explicit Kiosk Patient Attribution
  INSERT INTO public.activity_logs (
    actor_type, actor_patient_id, actor_name, actor_role,
    patient_id, entity_type, entity_id, action, details
  ) VALUES (
    'PATIENT', p_patient_id, 'Patient (Kiosk Session)', 'PATIENT',
    p_patient_id, 'DOSE', p_dose_log_id, 'STATUS_CHANGE',
    jsonb_build_object('new_status', p_status, 'skip_reason', p_skip_reason)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Revoke all execution rights from PUBLIC, anon, and authenticated; grant strictly to service_role
REVOKE ALL ON FUNCTION public.patient_record_dose_kiosk(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.patient_record_dose_kiosk(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;


-- 2. ATOMIC PIN FAILURE COUNTING AND LOCKOUT ENFORCEMENT
CREATE OR REPLACE FUNCTION public.record_failed_pin_attempt(
  p_patient_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_attempts INT;
  v_locked_until TIMESTAMPTZ;
BEGIN
  -- Atomically increment failed attempts
  UPDATE public.patient_profiles
  SET 
    failed_passcode_attempts = failed_passcode_attempts + 1,
    last_failed_attempt_at = NOW(),
    passcode_locked_until = CASE 
      WHEN failed_passcode_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
      ELSE passcode_locked_until
    END
  WHERE id = p_patient_id
  RETURNING failed_passcode_attempts, passcode_locked_until 
  INTO v_attempts, v_locked_until;

  -- Audit log failure or lockout
  IF v_attempts >= 5 THEN
    INSERT INTO public.activity_logs (
      actor_type, actor_patient_id, actor_name, actor_role,
      patient_id, entity_type, entity_id, action, details
    ) VALUES (
      'SYSTEM', p_patient_id, 'Security Subsystem', 'SYSTEM',
      p_patient_id, 'AUTH', p_patient_id, 'LOCKOUT',
      jsonb_build_object('attempts', v_attempts, 'locked_until', v_locked_until)
    );
  ELSE
    INSERT INTO public.activity_logs (
      actor_type, actor_patient_id, actor_name, actor_role,
      patient_id, entity_type, entity_id, action, details
    ) VALUES (
      'SYSTEM', p_patient_id, 'Security Subsystem', 'SYSTEM',
      p_patient_id, 'AUTH', p_patient_id, 'AUTH_ATTEMPT',
      jsonb_build_object('status', 'FAILED', 'attempt_count', v_attempts)
    );
  END IF;

  RETURN jsonb_build_object(
    'attempts', v_attempts,
    'is_locked', (v_locked_until IS NOT NULL AND v_locked_until > NOW()),
    'locked_until', v_locked_until
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.record_failed_pin_attempt(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_pin_attempt(UUID) TO service_role;


-- 3. PIN LOCKOUT RESET / RECOVERY RPC (For Caretakers/Admins)
CREATE OR REPLACE FUNCTION public.unlock_patient_passcode(
  p_patient_id UUID
)
RETURNS boolean AS $$
BEGIN
  -- Verify caller has management access or is admin
  IF NOT public.has_patient_access(p_patient_id, 'can_edit_profile') AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized to reset PIN lockout for this patient profile.';
  END IF;

  UPDATE public.patient_profiles
  SET 
    failed_passcode_attempts = 0,
    passcode_locked_until = NULL,
    updated_at = NOW()
  WHERE id = p_patient_id;

  -- Audit event
  INSERT INTO public.activity_logs (
    patient_id, entity_type, entity_id, action, details
  ) VALUES (
    p_patient_id, 'AUTH', p_patient_id, 'PASSCODE_RESET',
    jsonb_build_object('reset_by_user_id', auth.uid(), 'timestamp', NOW())
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.unlock_patient_passcode(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlock_patient_passcode(UUID) TO authenticated;
