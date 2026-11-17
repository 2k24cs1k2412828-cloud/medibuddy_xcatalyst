-- ==============================================================================
-- MediCare Connect - Migration 005: Triggers and State Machine Validation
-- ==============================================================================

-- 1. APPOINTMENT STATE MACHINE AND PROTECTED FIELD VALIDATION TRIGGER
CREATE OR REPLACE FUNCTION public.validate_appointment_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Terminal state check: COMPLETED or CANCELLED cannot be updated
  IF OLD.status IN ('COMPLETED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Terminal appointment status (%) cannot be modified.', OLD.status;
  END IF;

  -- Non-Manager / Patient Update Path
  IF NOT public.has_patient_access(OLD.patient_id, 'can_manage_appointments') 
     AND NOT public.is_admin() THEN
    
    -- Protected clinical and scheduling fields must remain identical (safe against NULLs via IS DISTINCT FROM)
    IF NEW.appointment_date IS DISTINCT FROM OLD.appointment_date OR
       NEW.doctor_name IS DISTINCT FROM OLD.doctor_name OR
       NEW.specialty IS DISTINCT FROM OLD.specialty OR
       NEW.clinic_hospital IS DISTINCT FROM OLD.clinic_hospital OR
       NEW.location_address IS DISTINCT FROM OLD.location_address OR
       NEW.instructions IS DISTINCT FROM OLD.instructions OR
       NEW.patient_id IS DISTINCT FROM OLD.patient_id OR
       NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'Unauthorized attempt to modify protected clinical appointment details.';
    END IF;

    -- Strict Patient status transition rules
    IF OLD.status = 'SCHEDULED' THEN
      IF NEW.status NOT IN ('SCHEDULED', 'ACKNOWLEDGED') THEN
        RAISE EXCEPTION 'Patients can only acknowledge scheduled appointments (SCHEDULED -> ACKNOWLEDGED).';
      END IF;
    ELSIF OLD.status = 'ACKNOWLEDGED' THEN
      IF NEW.status <> 'ACKNOWLEDGED' THEN
        RAISE EXCEPTION 'Acknowledged appointments must remain ACKNOWLEDGED for patient updates.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid status transition for patient action.';
    END IF;

  -- Caretaker / Admin Update Path
  ELSE
    -- Cannot regress from ACKNOWLEDGED back to SCHEDULED
    IF OLD.status = 'ACKNOWLEDGED' AND NEW.status = 'SCHEDULED' THEN
      RAISE EXCEPTION 'Acknowledged appointments cannot revert to unacknowledged SCHEDULED status.';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_validate_appointment_update ON public.appointments;
CREATE TRIGGER trg_validate_appointment_update BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_update();


-- 2. MEDICATION DOSE LOGS VALIDATION TRIGGER
CREATE OR REPLACE FUNCTION public.validate_dose_log_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Immutable identifiers and scheduled times
  IF NEW.patient_id IS DISTINCT FROM OLD.patient_id OR
     NEW.medication_id IS DISTINCT FROM OLD.medication_id OR
     NEW.dose_event_id IS DISTINCT FROM OLD.dose_event_id OR
     NEW.scheduled_time IS DISTINCT FROM OLD.scheduled_time THEN
    RAISE EXCEPTION 'Dose identifiers, patient linkage, and scheduled timestamps are strictly immutable.';
  END IF;

  -- Validation: SKIPPED requires structured skip_reason
  IF NEW.status = 'SKIPPED' AND (NEW.skip_reason IS NULL OR trim(NEW.skip_reason) = '') THEN
    RAISE EXCEPTION 'A structured skip reason is mandatory when reporting a skipped dose.';
  END IF;

  -- Non-manager cannot revert TAKEN back to PENDING
  IF OLD.status = 'TAKEN' AND NEW.status = 'PENDING' THEN
    IF NOT public.has_patient_access(OLD.patient_id, 'can_manage_medications') AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only caretakers or administrators may revert confirmed doses.';
    END IF;
  END IF;

  -- Record actual action time on status transition
  IF OLD.status = 'PENDING' AND NEW.status IN ('TAKEN', 'SKIPPED', 'MISSED') THEN
    NEW.actual_action_time := COALESCE(NEW.actual_action_time, NOW());
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_validate_dose_log_update ON public.medication_logs;
CREATE TRIGGER trg_validate_dose_log_update BEFORE UPDATE ON public.medication_logs
FOR EACH ROW EXECUTE FUNCTION public.validate_dose_log_update();


-- 3. AUDIT TRAIL IMMUTABILITY TRIGGER (Strict Append-Only)
CREATE OR REPLACE FUNCTION public.enforce_append_only_audit()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are strictly immutable. UPDATE and DELETE actions are forbidden on activity_logs.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_activity_logs ON public.activity_logs;
CREATE TRIGGER trg_protect_activity_logs BEFORE UPDATE OR DELETE ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only_audit();


-- 4. TRUSTED AUDIT ACTOR CONTEXT TRIGGER
CREATE OR REPLACE FUNCTION public.set_audit_actor_context()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role text;
  v_user_name text;
  v_patient_name text;
BEGIN
  -- Authenticated User (Admin, Caretaker, Family, or Direct Patient)
  IF auth.uid() IS NOT NULL THEN
    NEW.actor_type := 'USER';
    NEW.actor_user_id := auth.uid();
    NEW.actor_patient_id := NULL;
    SELECT role, full_name INTO v_user_role, v_user_name 
    FROM public.users WHERE id = auth.uid();
    NEW.actor_role := COALESCE(v_user_role, 'CARETAKER');
    NEW.actor_name := COALESCE(v_user_name, 'Authenticated User');

  -- Kiosk Patient Context (Derived explicitly via trusted server-side RPC)
  ELSIF NEW.actor_patient_id IS NOT NULL THEN
    NEW.actor_type := 'PATIENT';
    NEW.actor_user_id := NULL;
    NEW.actor_role := 'PATIENT';
    SELECT full_name INTO v_patient_name 
    FROM public.patient_profiles WHERE id = NEW.actor_patient_id;
    NEW.actor_name := COALESCE(v_patient_name, 'Patient (Kiosk PIN)');

  -- System Background Worker / Service Role
  ELSIF auth.role() = 'service_role' THEN
    NEW.actor_type := 'SYSTEM';
    NEW.actor_user_id := NULL;
    NEW.actor_patient_id := NULL;
    NEW.actor_role := 'SYSTEM';
    NEW.actor_name := 'System Background Worker';
  ELSE
    RAISE EXCEPTION 'Unauthenticated audit entries are forbidden.';
  END IF;

  NEW.created_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_set_audit_actor_context ON public.activity_logs;
CREATE TRIGGER trg_set_audit_actor_context BEFORE INSERT ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.set_audit_actor_context();


-- 5. AUTOMATIC PRIMARY CAREGIVER BINDING ON PROFILE CREATION
CREATE OR REPLACE FUNCTION public.on_patient_profile_created()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_admin() THEN
    -- Admin creation: Profile created; caretaker will be linked separately
    RETURN NEW;
  END IF;

  -- Auto-link the creating Caretaker as PRIMARY_CARETAKER
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.patient_access (
      patient_id,
      user_id,
      relationship,
      permissions,
      status
    ) VALUES (
      NEW.id,
      auth.uid(),
      'PRIMARY_CARETAKER',
      jsonb_build_object(
        'is_primary_caregiver', true,
        'can_manage_medications', true,
        'can_manage_appointments', true,
        'can_manage_routines', true,
        'can_resolve_assistance', true,
        'can_manage_access', true,
        'can_edit_profile', true,
        'can_manage_notifications', true,
        'can_view_audit', true
      ),
      'ACTIVE'
    )
    ON CONFLICT (patient_id, user_id) DO UPDATE SET
      relationship = 'PRIMARY_CARETAKER',
      status = 'ACTIVE';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_on_patient_profile_created ON public.patient_profiles;
CREATE TRIGGER trg_on_patient_profile_created AFTER INSERT ON public.patient_profiles
FOR EACH ROW EXECUTE FUNCTION public.on_patient_profile_created();
