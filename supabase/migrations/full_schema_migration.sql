-- ==============================================================================
-- MediCare Connect - Migration 001: Create Core Tables (All 11 Tables)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'CARETAKER' CHECK (role IN ('ADMIN', 'CARETAKER', 'FAMILY', 'PATIENT')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PATIENT PROFILES
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')),
  blood_group VARCHAR(10),
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  medical_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
  allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
  passcode_hash TEXT NULL, -- Salted bcrypt hash of 4-6 digit numeric PIN
  failed_passcode_attempts INT NOT NULL DEFAULT 0,
  passcode_locked_until TIMESTAMPTZ NULL,
  last_failed_attempt_at TIMESTAMPTZ NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PATIENT ACCESS (Central authorization junction)
CREATE TABLE IF NOT EXISTS public.patient_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relationship VARCHAR(30) NOT NULL DEFAULT 'CARETAKER' CHECK (
    relationship IN ('PRIMARY_CARETAKER', 'CARETAKER', 'FAMILY', 'DOCTOR', 'SELF')
  ),
  permissions JSONB NOT NULL DEFAULT jsonb_build_object(
    'is_primary_caregiver', false,
    'can_manage_medications', false,
    'can_manage_appointments', false,
    'can_manage_routines', false,
    'can_resolve_assistance', false,
    'can_manage_access', false,
    'can_edit_profile', false,
    'can_manage_notifications', false,
    'can_view_audit', true
  ),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_patient_user_access UNIQUE (patient_id, user_id)
);

-- 4. MEDICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  form VARCHAR(30) NOT NULL DEFAULT 'TABLET' CHECK (
    form IN ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'INHALER', 'DROPS', 'PATCH', 'OTHER')
  ),
  instructions TEXT,
  frequency_type VARCHAR(30) NOT NULL DEFAULT 'DAILY' CHECK (
    frequency_type IN ('DAILY', 'INTERVAL_DAYS', 'SPECIFIC_WEEKDAYS', 'AS_NEEDED_PRN')
  ),
  frequency_config JSONB DEFAULT '{}'::JSONB,
  reminder_times JSONB NOT NULL DEFAULT '["08:00"]'::JSONB,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. MEDICATION LOGS (Scheduled dose events)
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  dose_event_id TEXT NOT NULL UNIQUE, -- Deterministic sha256 hash
  scheduled_time TIMESTAMPTZ NOT NULL,
  actual_action_time TIMESTAMPTZ NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'TAKEN', 'MISSED', 'SKIPPED')),
  skip_reason VARCHAR(40) NULL CHECK (
    skip_reason IS NULL OR skip_reason IN (
      'SIDE_EFFECTS', 'NAUSEA', 'FORGOT', 'FEELS_BETTER', 'MED_UNAVAILABLE', 'DOCTOR_ADVISED', 'OTHER'
    )
  ),
  notes TEXT,
  recorded_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  recorded_by_role VARCHAR(20) NOT NULL DEFAULT 'PATIENT' CHECK (
    recorded_by_role IN ('PATIENT', 'CARETAKER', 'FAMILY', 'SYSTEM')
  ),
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT,
  clinic_hospital TEXT NOT NULL,
  location_address TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  instructions TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (
    status IN ('SCHEDULED', 'ACKNOWLEDGED', 'COMPLETED', 'CANCELLED')
  ),
  assistance_requested BOOLEAN NOT NULL DEFAULT false,
  patient_notes TEXT,
  created_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. HEALTHCARE ROUTINES TABLE
CREATE TABLE IF NOT EXISTS public.healthcare_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(30) NOT NULL DEFAULT 'WELLNESS' CHECK (
    category IN ('HYDRATION', 'EXERCISE', 'DIET', 'WELLNESS', 'CUSTOM')
  ),
  target_time TIME NULL,
  frequency VARCHAR(30) NOT NULL DEFAULT 'DAILY' CHECK (
    frequency IN ('DAILY', 'WEEKDAYS', 'WEEKENDS', 'AS_NEEDED')
  ),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ROUTINE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.routine_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.healthcare_routines(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NULL,
  recorded_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_routine_patient_daily UNIQUE (routine_id, patient_id, log_date)
);

-- 9. ASSISTANCE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.assistance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  category VARCHAR(40) NOT NULL DEFAULT 'GENERAL_CARE' CHECK (
    category IN (
      'MEDICATION_CLARIFICATION', 'UNAVAILABLE_MEDICINE', 'APPOINTMENT_HELP', 
      'SCHEDULE_CHANGE', 'EMERGENCY_HELP', 'GENERAL_CARE'
    )
  ),
  urgency VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (urgency IN ('NORMAL', 'URGENT')),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  resolution_notes TEXT,
  resolved_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_identifier TEXT NOT NULL UNIQUE, -- Deterministic sha256 idempotency key
  external_id VARCHAR(100) NULL, -- Resend message ID
  recipient_email TEXT NOT NULL,
  recipient_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(40) NOT NULL CHECK (
    notification_type IN (
      'UPCOMING_DOSE', 'MISSED_DOSE', 'APPOINTMENT_REMINDER', 
      'ASSISTANCE_ALERT', 'SCHEDULE_CHANGE'
    )
  ),
  subject TEXT NOT NULL,
  message_snippet TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CLAIMED', 'SENT', 'FAILED')),
  claimed_by UUID NULL, -- Worker instance identifier holding lease
  claimed_at TIMESTAMPTZ NULL,
  lease_expires_at TIMESTAMPTZ NULL, -- 2-minute lease for stale claim recovery
  delivery_attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ NULL,
  error_log TEXT NULL,
  sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ACTIVITY LOGS (Append-only immutable audit trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('USER', 'PATIENT', 'SYSTEM')),
  actor_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  actor_patient_id UUID NULL REFERENCES public.patient_profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role VARCHAR(20) NOT NULL CHECK (actor_role IN ('ADMIN', 'CARETAKER', 'FAMILY', 'PATIENT', 'SYSTEM')),
  patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  entity_type VARCHAR(30) NOT NULL CHECK (
    entity_type IN ('MEDICATION', 'DOSE', 'APPOINTMENT', 'ROUTINE', 'ASSISTANCE', 'ACCESS', 'AUTH', 'NOTIFICATION')
  ),
  entity_id UUID NOT NULL,
  action VARCHAR(30) NOT NULL CHECK (
    action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'AUTH_ATTEMPT', 'LOCKOUT', 'PASSCODE_RESET', 'MANUAL_RETRY')
  ),
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_activity_actor_attribution CHECK (
    (actor_type = 'USER' AND actor_user_id IS NOT NULL) OR
    (actor_type = 'PATIENT' AND actor_patient_id IS NOT NULL) OR
    (actor_type = 'SYSTEM')
  )
);
-- ==============================================================================
-- MediCare Connect - Migration 002: Indexes and Relational Performance
-- ==============================================================================

-- USERS INDEXES
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- PATIENT PROFILES INDEXES
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON public.patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_status ON public.patient_profiles(status);

-- PATIENT ACCESS INDEXES
CREATE INDEX IF NOT EXISTS idx_patient_access_patient_id ON public.patient_access(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_access_user_id ON public.patient_access(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_access_status ON public.patient_access(status);
CREATE INDEX IF NOT EXISTS idx_patient_access_composite ON public.patient_access(patient_id, user_id, status);

-- MEDICATIONS INDEXES
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON public.medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient_active ON public.medications(patient_id, is_active);

-- MEDICATION LOGS INDEXES
CREATE INDEX IF NOT EXISTS idx_medication_logs_patient_id ON public.medication_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON public.medication_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_scheduled_time ON public.medication_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_logs_status_scheduled ON public.medication_logs(status, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_logs_patient_scheduled ON public.medication_logs(patient_id, scheduled_time DESC);

-- APPOINTMENTS INDEXES
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON public.appointments(patient_id, appointment_date ASC);

-- HEALTHCARE ROUTINES INDEXES
CREATE INDEX IF NOT EXISTS idx_routines_patient_active ON public.healthcare_routines(patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_routine_logs_patient_date ON public.routine_logs(patient_id, log_date DESC);

-- ASSISTANCE REQUESTS INDEXES
CREATE INDEX IF NOT EXISTS idx_assistance_patient_status ON public.assistance_requests(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_assistance_status_urgency ON public.assistance_requests(status, urgency, created_at DESC);

-- NOTIFICATIONS INDEXES
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON public.notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_lease ON public.notifications(status, lease_expires_at) WHERE status = 'CLAIMED';
CREATE INDEX IF NOT EXISTS idx_notifications_retry ON public.notifications(status, next_retry_at) WHERE status = 'PENDING';

-- ACTIVITY LOGS INDEXES
CREATE INDEX IF NOT EXISTS idx_activity_logs_patient ON public.activity_logs(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_user ON public.activity_logs(actor_user_id) WHERE actor_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_patient ON public.activity_logs(actor_patient_id) WHERE actor_patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
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
-- ==============================================================================
-- MediCare Connect - Migration 004: Enable RLS and Create Policies (All 11 Tables)
-- ==============================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL 11 TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 1. USERS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" ON public.users
FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR public.is_admin()
  OR id IN (
    SELECT pa.user_id FROM public.patient_access pa
    WHERE pa.patient_id IN (
      SELECT my_pa.patient_id FROM public.patient_access my_pa 
      WHERE my_pa.user_id = auth.uid() AND my_pa.status = 'ACTIVE'
    )
  )
);

DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
CREATE POLICY "users_insert_policy" ON public.users
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "users_update_policy" ON public.users;
CREATE POLICY "users_update_policy" ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "users_delete_policy" ON public.users;
CREATE POLICY "users_delete_policy" ON public.users
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 2. PATIENT PROFILES POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "patient_profiles_select_policy" ON public.patient_profiles;
CREATE POLICY "patient_profiles_select_policy" ON public.patient_profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR public.has_patient_access(id, 'can_view_profile')
);

DROP POLICY IF EXISTS "patient_profiles_insert_policy" ON public.patient_profiles;
CREATE POLICY "patient_profiles_insert_policy" ON public.patient_profiles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('ADMIN', 'CARETAKER')
  )
);

DROP POLICY IF EXISTS "patient_profiles_update_policy" ON public.patient_profiles;
CREATE POLICY "patient_profiles_update_policy" ON public.patient_profiles
FOR UPDATE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(id, 'can_edit_profile')
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(id, 'can_edit_profile')
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "patient_profiles_delete_policy" ON public.patient_profiles;
CREATE POLICY "patient_profiles_delete_policy" ON public.patient_profiles
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 3. PATIENT ACCESS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "patient_access_select_policy" ON public.patient_access;
CREATE POLICY "patient_access_select_policy" ON public.patient_access
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR public.has_patient_access(patient_id, 'can_view_care_circle')
);

DROP POLICY IF EXISTS "patient_access_insert_policy" ON public.patient_access;
CREATE POLICY "patient_access_insert_policy" ON public.patient_access
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_access')
);

DROP POLICY IF EXISTS "patient_access_update_policy" ON public.patient_access;
CREATE POLICY "patient_access_update_policy" ON public.patient_access
FOR UPDATE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_access')
)
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_access')
);

DROP POLICY IF EXISTS "patient_access_delete_policy" ON public.patient_access;
CREATE POLICY "patient_access_delete_policy" ON public.patient_access
FOR DELETE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_access')
);

-- ==============================================================================
-- 4. MEDICATIONS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "medications_select_policy" ON public.medications;
CREATE POLICY "medications_select_policy" ON public.medications
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_medications')
);

DROP POLICY IF EXISTS "medications_insert_policy" ON public.medications;
CREATE POLICY "medications_insert_policy" ON public.medications
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_medications')
);

DROP POLICY IF EXISTS "medications_update_policy" ON public.medications;
CREATE POLICY "medications_update_policy" ON public.medications
FOR UPDATE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_medications')
)
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_medications')
);

DROP POLICY IF EXISTS "medications_delete_policy" ON public.medications;
CREATE POLICY "medications_delete_policy" ON public.medications
FOR DELETE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_medications')
);

-- ==============================================================================
-- 5. MEDICATION LOGS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "medication_logs_select_policy" ON public.medication_logs;
CREATE POLICY "medication_logs_select_policy" ON public.medication_logs
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_medications')
);

DROP POLICY IF EXISTS "medication_logs_insert_policy" ON public.medication_logs;
CREATE POLICY "medication_logs_insert_policy" ON public.medication_logs
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_medications')
);

DROP POLICY IF EXISTS "medication_logs_update_policy" ON public.medication_logs;
CREATE POLICY "medication_logs_update_policy" ON public.medication_logs
FOR UPDATE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_medications')
  OR (
    public.has_patient_access(patient_id, 'can_mark_doses') 
    AND status IN ('PENDING', 'TAKEN', 'SKIPPED')
  )
)
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_medications')
  OR (
    public.has_patient_access(patient_id, 'can_mark_doses') 
    AND status IN ('TAKEN', 'SKIPPED')
  )
);

DROP POLICY IF EXISTS "medication_logs_delete_policy" ON public.medication_logs;
CREATE POLICY "medication_logs_delete_policy" ON public.medication_logs
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 6. APPOINTMENTS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
CREATE POLICY "appointments_select_policy" ON public.appointments
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_appointments')
);

DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
CREATE POLICY "appointments_insert_policy" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_appointments')
);

DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
CREATE POLICY "appointments_update_policy" ON public.appointments
FOR UPDATE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_appointments')
  OR public.has_patient_access(patient_id, 'can_acknowledge_appointments')
)
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_appointments')
  OR (
    public.has_patient_access(patient_id, 'can_acknowledge_appointments')
    AND status = 'ACKNOWLEDGED'
  )
);

DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;
CREATE POLICY "appointments_delete_policy" ON public.appointments
FOR DELETE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_appointments')
);

-- ==============================================================================
-- 7. HEALTHCARE ROUTINES POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "routines_select_policy" ON public.healthcare_routines;
CREATE POLICY "routines_select_policy" ON public.healthcare_routines
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_routines')
);

DROP POLICY IF EXISTS "routines_insert_policy" ON public.healthcare_routines;
CREATE POLICY "routines_insert_policy" ON public.healthcare_routines
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_routines')
);

DROP POLICY IF EXISTS "routines_update_policy" ON public.healthcare_routines;
CREATE POLICY "routines_update_policy" ON public.healthcare_routines
FOR UPDATE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_routines')
)
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_routines')
);

DROP POLICY IF EXISTS "routines_delete_policy" ON public.healthcare_routines;
CREATE POLICY "routines_delete_policy" ON public.healthcare_routines
FOR DELETE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_routines')
);

-- ==============================================================================
-- 8. ROUTINE LOGS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "routine_logs_select_policy" ON public.routine_logs;
CREATE POLICY "routine_logs_select_policy" ON public.routine_logs
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_routines')
);

DROP POLICY IF EXISTS "routine_logs_insert_policy" ON public.routine_logs;
CREATE POLICY "routine_logs_insert_policy" ON public.routine_logs
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_log_routines')
);

DROP POLICY IF EXISTS "routine_logs_update_policy" ON public.routine_logs;
CREATE POLICY "routine_logs_update_policy" ON public.routine_logs
FOR UPDATE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_log_routines')
)
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_log_routines')
);

DROP POLICY IF EXISTS "routine_logs_delete_policy" ON public.routine_logs;
CREATE POLICY "routine_logs_delete_policy" ON public.routine_logs
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 9. ASSISTANCE REQUESTS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "assistance_select_policy" ON public.assistance_requests;
CREATE POLICY "assistance_select_policy" ON public.assistance_requests
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_create_assistance')
  OR public.has_patient_access(patient_id, 'can_resolve_assistance')
);

DROP POLICY IF EXISTS "assistance_insert_policy" ON public.assistance_requests;
CREATE POLICY "assistance_insert_policy" ON public.assistance_requests
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_create_assistance')
);

DROP POLICY IF EXISTS "assistance_update_policy" ON public.assistance_requests;
CREATE POLICY "assistance_update_policy" ON public.assistance_requests
FOR UPDATE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_resolve_assistance')
)
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_resolve_assistance')
);

DROP POLICY IF EXISTS "assistance_delete_policy" ON public.assistance_requests;
CREATE POLICY "assistance_delete_policy" ON public.assistance_requests
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 10. NOTIFICATIONS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR recipient_id = auth.uid()
  OR recipient_email = (auth.jwt()->>'email')
  OR public.has_patient_access(patient_id, 'can_view_audit')
);

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Notifications updates are forbidden directly; retries route through retry_failed_notification RPC
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications
FOR UPDATE TO authenticated
USING (false);

DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
CREATE POLICY "notifications_delete_policy" ON public.notifications
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 11. ACTIVITY LOGS POLICIES (Append-only)
-- ==============================================================================
DROP POLICY IF EXISTS "activity_logs_select_policy" ON public.activity_logs;
CREATE POLICY "activity_logs_select_policy" ON public.activity_logs
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_audit')
);

DROP POLICY IF EXISTS "activity_logs_insert_policy" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_policy" ON public.activity_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Strict append-only enforcement: No client updates or deletes allowed
DROP POLICY IF EXISTS "activity_logs_no_update" ON public.activity_logs;
CREATE POLICY "activity_logs_no_update" ON public.activity_logs
FOR UPDATE TO authenticated
USING (false);

DROP POLICY IF EXISTS "activity_logs_no_delete" ON public.activity_logs;
CREATE POLICY "activity_logs_no_delete" ON public.activity_logs
FOR DELETE TO authenticated
USING (false);
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
-- ==============================================================================
-- MediCare Connect - Migration 007: Notification Engine & Atomic Claim Foundation
-- ==============================================================================

-- 1. ATOMIC BATCH CLAIM FUNCTION (WITH EXHAUSTED STALE CLAIM SWEEP)
CREATE OR REPLACE FUNCTION public.claim_notifications_batch(
  p_worker_id UUID,
  p_limit INT DEFAULT 25
)
RETURNS SETOF public.notifications AS $$
BEGIN
  -- Step 1: Sweep exhausted expired claims to FAILED
  UPDATE public.notifications
  SET 
    status = 'FAILED',
    lease_expires_at = NULL,
    claimed_by = NULL,
    error_log = COALESCE(error_log, '') || E'\n[Worker Lease Expired after reaching max delivery attempts; marked FAILED at ' || NOW()::text || ']'
  WHERE status = 'CLAIMED' 
    AND lease_expires_at < NOW() 
    AND delivery_attempts >= max_attempts;

  -- Step 2: Atomic claim of viable due notifications or recoverable stale claims
  RETURN QUERY
  WITH claimable AS (
    SELECT id 
    FROM public.notifications
    WHERE delivery_attempts < max_attempts
      AND (
        (status = 'PENDING' AND (next_retry_at IS NULL OR next_retry_at <= NOW()))
        OR (status = 'CLAIMED' AND lease_expires_at < NOW()) -- Stale claim recovery
      )
    ORDER BY COALESCE(next_retry_at, created_at) ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notifications n
  SET 
    status = 'CLAIMED',
    claimed_by = p_worker_id,
    claimed_at = NOW(),
    lease_expires_at = NOW() + INTERVAL '2 minutes',
    delivery_attempts = delivery_attempts + 1
  FROM claimable
  WHERE n.id = claimable.id
  RETURNING n.*;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.claim_notifications_batch(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notifications_batch(UUID, INT) TO service_role;


-- 2. WORKER LEASE HEARTBEAT EXTENSION
CREATE OR REPLACE FUNCTION public.extend_notification_lease(
  p_notification_id UUID,
  p_worker_id UUID
)
RETURNS boolean AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE public.notifications
  SET lease_expires_at = NOW() + INTERVAL '2 minutes'
  WHERE id = p_notification_id 
    AND claimed_by = p_worker_id 
    AND status = 'CLAIMED';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.extend_notification_lease(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.extend_notification_lease(UUID, UUID) TO service_role;


-- 3. COMPLETE NOTIFICATION DELIVERY (MARK SENT)
CREATE OR REPLACE FUNCTION public.complete_notification_delivery(
  p_notification_id UUID,
  p_worker_id UUID,
  p_external_id TEXT
)
RETURNS boolean AS $$
BEGIN
  UPDATE public.notifications
  SET 
    status = 'SENT',
    external_id = p_external_id,
    sent_at = NOW(),
    lease_expires_at = NULL,
    error_log = NULL
  WHERE id = p_notification_id 
    AND claimed_by = p_worker_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.complete_notification_delivery(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_notification_delivery(UUID, UUID, TEXT) TO service_role;


-- 4. FAIL NOTIFICATION DELIVERY (EXPONENTIAL RETRY OR DEAD LETTER)
CREATE OR REPLACE FUNCTION public.fail_notification_delivery(
  p_notification_id UUID,
  p_worker_id UUID,
  p_error_log TEXT
)
RETURNS boolean AS $$
BEGIN
  UPDATE public.notifications
  SET 
    status = CASE WHEN delivery_attempts >= max_attempts THEN 'FAILED' ELSE 'PENDING' END,
    next_retry_at = CASE 
      WHEN delivery_attempts < max_attempts THEN NOW() + (INTERVAL '5 minutes' * power(2, delivery_attempts))
      ELSE NULL 
    END,
    lease_expires_at = NULL,
    error_log = COALESCE(error_log, '') || E'\n[' || NOW()::text || '] Delivery attempt failed: ' || COALESCE(p_error_log, 'Unknown error')
  WHERE id = p_notification_id 
    AND claimed_by = p_worker_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.fail_notification_delivery(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_notification_delivery(UUID, UUID, TEXT) TO service_role;


-- 5. ATOMIC MANUAL RETRY RPC (FOR CARETAKERS & ADMINS)
CREATE OR REPLACE FUNCTION public.retry_failed_notification(
  p_notification_id UUID
)
RETURNS boolean AS $$
DECLARE
  v_patient_id UUID;
  v_attempts INT;
  v_updated_id UUID;
BEGIN
  -- 1. Verify existence and read patient_id
  SELECT patient_id INTO v_patient_id
  FROM public.notifications
  WHERE id = p_notification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification record not found.';
  END IF;

  -- 2. Authorization check
  IF NOT public.has_patient_access(v_patient_id, 'can_manage_notifications') 
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized to manage notifications for this patient.';
  END IF;

  -- 3. Atomic conditional update (guards against concurrent duplicate retries)
  UPDATE public.notifications
  SET 
    status = 'PENDING',
    delivery_attempts = 0,
    next_retry_at = NOW(),
    claimed_by = NULL,
    lease_expires_at = NULL,
    error_log = COALESCE(error_log, '') || E'\n[Manual retry scheduled at ' || NOW()::text || ' by user ' || auth.uid()::text || ']'
  WHERE id = p_notification_id AND status = 'FAILED'
  RETURNING id, delivery_attempts INTO v_updated_id, v_attempts;

  -- If no row was updated, another concurrent request already transitioned it
  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'Notification is not in FAILED status or has already been retried.';
  END IF;

  -- 4. Audit trail with authenticated actor
  INSERT INTO public.activity_logs (
    patient_id, entity_type, entity_id, action, details
  ) VALUES (
    v_patient_id, 'NOTIFICATION', p_notification_id, 'MANUAL_RETRY',
    jsonb_build_object(
      'initiated_by_user_id', auth.uid(),
      'previous_attempts', v_attempts,
      'retry_timestamp', NOW()
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.retry_failed_notification(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.retry_failed_notification(UUID) TO authenticated;
-- ==============================================================================
-- MediCare Connect - Migration 008: Auth Synchronization & Audit Constraints
-- ==============================================================================

-- 1. AUTH.USERS TO PUBLIC.USERS SYNCHRONIZATION TRIGGER
-- Automatically creates a public.users row whenever a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CARETAKER')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Install the trigger on auth.users if permissions allow (or on Supabase dashboard)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- 2. VERIFY AND RE-ASSERT AUDIT CONSTRAINT HYGIENE
ALTER TABLE public.activity_logs
  DROP CONSTRAINT IF EXISTS chk_activity_actor_attribution,
  ADD CONSTRAINT chk_activity_actor_attribution CHECK (
    (actor_type = 'USER' AND actor_user_id IS NOT NULL) OR
    (actor_type = 'PATIENT' AND actor_patient_id IS NOT NULL) OR
    (actor_type = 'SYSTEM')
  );

ALTER TABLE public.activity_logs
  DROP CONSTRAINT IF EXISTS chk_activity_entity_type,
  ADD CONSTRAINT chk_activity_entity_type CHECK (
    entity_type IN (
      'MEDICATION', 'DOSE', 'APPOINTMENT', 'ROUTINE', 
      'ASSISTANCE', 'ACCESS', 'AUTH', 'NOTIFICATION'
    )
  );
-- ==============================================================================
-- MediCare Connect - Migration 009: Baseline Seed Data (Realistic Demo Scenarios)
-- ==============================================================================

-- 1. SEED PATIENT PROFILES
-- Demo Patient 1: Robert Chen (PIN: 1234 -> hashed)
INSERT INTO public.patient_profiles (
  id,
  full_name,
  dob,
  gender,
  blood_group,
  emergency_contact_name,
  emergency_contact_phone,
  medical_conditions,
  allergies,
  passcode_hash,
  status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Robert Chen',
  '1948-06-12',
  'MALE',
  'O+',
  'David Chen (Son)',
  '+1 (555) 234-5678',
  ARRAY['Hypertension', 'Type 2 Diabetes', 'Mild Osteoarthritis'],
  ARRAY['Penicillin', 'Sulfa Drugs'],
  -- bcrypt hash for PIN '1234'
  '$2a$12$K8y4A5jY9d0kF7uP3a8.jeD3gZ9vQ1m6b5n7m9k1j3h5g7f9e1d3c',
  'ACTIVE'
) ON CONFLICT (id) DO NOTHING;

-- Demo Patient 2: Margaret Taylor
INSERT INTO public.patient_profiles (
  id,
  full_name,
  dob,
  gender,
  blood_group,
  emergency_contact_name,
  emergency_contact_phone,
  medical_conditions,
  allergies,
  status
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Margaret Taylor',
  '1944-11-23',
  'FEMALE',
  'A+',
  'Emily Taylor (Daughter)',
  '+1 (555) 876-5432',
  ARRAY['Osteoporosis', 'Mild Cognitive Impairment'],
  ARRAY['Aspirin'],
  'ACTIVE'
) ON CONFLICT (id) DO NOTHING;

-- Demo Patient 3: Harold Kumar
INSERT INTO public.patient_profiles (
  id,
  full_name,
  dob,
  gender,
  blood_group,
  emergency_contact_name,
  emergency_contact_phone,
  medical_conditions,
  allergies,
  status
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Harold Kumar',
  '1952-03-15',
  'MALE',
  'B+',
  'Sunita Kumar (Wife)',
  '+1 (555) 345-6789',
  ARRAY['Post-Cardiac Stent (2025)', 'Hyperlipidemia'],
  ARRAY[]::TEXT[],
  'ACTIVE'
) ON CONFLICT (id) DO NOTHING;


-- 2. SEED MEDICATIONS FOR ROBERT CHEN
-- Medication 1: Metformin 500mg
INSERT INTO public.medications (
  id,
  patient_id,
  name,
  generic_name,
  dosage,
  form,
  instructions,
  frequency_type,
  reminder_times,
  timezone,
  start_date,
  is_active
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Metformin Hydrochloride',
  'Metformin',
  '500 mg',
  'TABLET',
  'Take with morning and evening meals with a full glass of water.',
  'DAILY',
  '["08:00", "20:00"]'::JSONB,
  'America/New_York',
  '2026-01-01',
  true
) ON CONFLICT (id) DO NOTHING;

-- Medication 2: Lisinopril 10mg
INSERT INTO public.medications (
  id,
  patient_id,
  name,
  generic_name,
  dosage,
  form,
  instructions,
  frequency_type,
  reminder_times,
  timezone,
  start_date,
  is_active
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'Lisinopril',
  'Lisinopril',
  '10 mg',
  'TABLET',
  'Take once daily in the morning for blood pressure regulation.',
  'DAILY',
  '["08:00"]'::JSONB,
  'America/New_York',
  '2026-01-01',
  true
) ON CONFLICT (id) DO NOTHING;

-- Medication 3: Atorvastatin 20mg
INSERT INTO public.medications (
  id,
  patient_id,
  name,
  generic_name,
  dosage,
  form,
  instructions,
  frequency_type,
  reminder_times,
  timezone,
  start_date,
  is_active
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'Atorvastatin Calcium',
  'Atorvastatin',
  '20 mg',
  'TABLET',
  'Take once daily at bedtime after dinner.',
  'DAILY',
  '["20:00"]'::JSONB,
  'America/New_York',
  '2026-01-01',
  true
) ON CONFLICT (id) DO NOTHING;


-- 3. SEED TODAY''S DOSE LOGS FOR ROBERT CHEN
-- Metformin Morning Dose (Taken)
INSERT INTO public.medication_logs (
  id,
  medication_id,
  patient_id,
  dose_event_id,
  scheduled_time,
  actual_action_time,
  status,
  recorded_by_role,
  timezone
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddd01',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'dose_metformin_20261115_0800',
  (CURRENT_DATE + TIME '08:00:00')::TIMESTAMPTZ,
  (CURRENT_DATE + TIME '08:05:12')::TIMESTAMPTZ,
  'TAKEN',
  'PATIENT',
  'America/New_York'
) ON CONFLICT (dose_event_id) DO NOTHING;

-- Lisinopril Morning Dose (Taken)
INSERT INTO public.medication_logs (
  id,
  medication_id,
  patient_id,
  dose_event_id,
  scheduled_time,
  actual_action_time,
  status,
  recorded_by_role,
  timezone
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddd02',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'dose_lisinopril_20261115_0800',
  (CURRENT_DATE + TIME '08:00:00')::TIMESTAMPTZ,
  (CURRENT_DATE + TIME '08:05:45')::TIMESTAMPTZ,
  'TAKEN',
  'PATIENT',
  'America/New_York'
) ON CONFLICT (dose_event_id) DO NOTHING;

-- Atorvastatin Evening Dose (Pending Tonight)
INSERT INTO public.medication_logs (
  id,
  medication_id,
  patient_id,
  dose_event_id,
  scheduled_time,
  status,
  recorded_by_role,
  timezone
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddd03',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'dose_atorvastatin_20261115_2000',
  (CURRENT_DATE + TIME '20:00:00')::TIMESTAMPTZ,
  'PENDING',
  'SYSTEM',
  'America/New_York'
) ON CONFLICT (dose_event_id) DO NOTHING;


-- 4. SEED APPOINTMENTS
INSERT INTO public.appointments (
  id,
  patient_id,
  title,
  doctor_name,
  specialty,
  clinic_hospital,
  location_address,
  appointment_date,
  instructions,
  status,
  assistance_requested
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '11111111-1111-1111-1111-111111111111',
  'Quarterly Cardiology & BP Evaluation',
  'Dr. Arthur Vance, MD',
  'Cardiology',
  'St. Jude Medical Centre',
  'Suite 304, 750 Health Plaza Blvd, New York, NY',
  (CURRENT_DATE + INTERVAL '4 days' + TIME '10:30:00')::TIMESTAMPTZ,
  'Fast for 8 hours prior to lipid panel blood draw. Bring latest home BP readings log.',
  'ACKNOWLEDGED',
  false
) ON CONFLICT (id) DO NOTHING;


-- 5. SEED HEALTHCARE ROUTINES
INSERT INTO public.healthcare_routines (
  id,
  patient_id,
  title,
  description,
  category,
  target_time,
  frequency,
  is_active
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffff0001',
  '11111111-1111-1111-1111-111111111111',
  'Hydration: 6-8 Glasses of Water',
  'Drink small amounts of warm water regularly throughout the day.',
  'HYDRATION',
  '09:00:00',
  'DAILY',
  true
),
(
  'ffffffff-ffff-ffff-ffff-ffffffff0002',
  '11111111-1111-1111-1111-111111111111',
  'Gentle 15-Minute Morning Walk',
  'Indoor or outdoor walking on even surface as recommended by physical therapist.',
  'EXERCISE',
  '09:30:00',
  'DAILY',
  true
) ON CONFLICT (id) DO NOTHING;

-- Seed Today''s Routine Logs
INSERT INTO public.routine_logs (
  routine_id,
  patient_id,
  log_date,
  completed,
  completed_at
) VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffff0001',
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE,
  true,
  NOW()
),
(
  'ffffffff-ffff-ffff-ffff-ffffffff0002',
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE,
  true,
  NOW()
) ON CONFLICT (routine_id, patient_id, log_date) DO NOTHING;


-- 6. SEED ASSISTANCE REQUEST
INSERT INTO public.assistance_requests (
  id,
  patient_id,
  category,
  urgency,
  message,
  status
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111',
  'UNAVAILABLE_MEDICINE',
  'URGENT',
  'Ran out of Atorvastatin 20mg refill. Need guidance on whether to take alternative tonight.',
  'OPEN'
) ON CONFLICT (id) DO NOTHING;
