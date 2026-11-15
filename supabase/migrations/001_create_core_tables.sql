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
