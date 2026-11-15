-- ==============================================================================
-- MediCare Connect - Migration 003: Authorization Helper Functions
-- ==============================================================================

-- 1. Helper: Check if current authenticated user is a System Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

-- Revoke public access, grant strictly to authenticated and service_role
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;


-- 2. Helper: Check if current user has verified permission for a patient profile
-- Enforces strict fail-closed security and separates Patient from Caretaker capabilities
CREATE OR REPLACE FUNCTION public.has_patient_access(
  p_patient_id uuid,
  p_permission text
)
RETURNS boolean AS $$
DECLARE
  v_is_patient boolean;
  v_patient_allowed_permissions text[] := ARRAY[
    'can_view_profile',
    'can_view_medications',
    'can_mark_doses',
    'can_report_skips',
    'can_request_schedule_change',
    'can_view_appointments',
    'can_acknowledge_appointments',
    'can_view_routines',
    'can_log_routines',
    'can_create_assistance',
    'can_view_care_circle',
    'can_view_audit'
  ];
BEGIN
  -- Fail-closed validation: Require both parameters
  IF auth.uid() IS NULL OR p_patient_id IS NULL OR p_permission IS NULL OR trim(p_permission) = '' THEN
    RETURN false;
  END IF;

  -- Administrators always possess access
  IF public.is_admin() THEN
    RETURN true;
  END IF;

  -- 1. Check if auth.uid() is the registered Patient user account
  SELECT EXISTS (
    SELECT 1 FROM public.patient_profiles
    WHERE id = p_patient_id AND user_id = auth.uid() AND status = 'ACTIVE'
  ) INTO v_is_patient;

  IF v_is_patient THEN
    -- Patient identity ONLY satisfies explicitly whitelisted patient operational capabilities
    -- Patients NEVER implicitly satisfy caretaker administrative permissions
    RETURN p_permission = ANY(v_patient_allowed_permissions);
  END IF;

  -- 2. Otherwise evaluate Caretaker or Family active access from patient_access
  RETURN EXISTS (
    SELECT 1 FROM public.patient_access
    WHERE patient_id = p_patient_id 
      AND user_id = auth.uid() 
      AND status = 'ACTIVE'
      AND (permissions->>p_permission)::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

-- Revoke public access, grant strictly to authenticated and service_role
REVOKE ALL ON FUNCTION public.has_patient_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_patient_access(uuid, text) TO authenticated, service_role;
