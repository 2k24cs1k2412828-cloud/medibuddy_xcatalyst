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

CREATE POLICY "users_insert_policy" ON public.users
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "users_update_policy" ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "users_delete_policy" ON public.users
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 2. PATIENT PROFILES POLICIES
-- ==============================================================================
CREATE POLICY "patient_profiles_select_policy" ON public.patient_profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR public.has_patient_access(id, 'can_view_profile')
);

CREATE POLICY "patient_profiles_insert_policy" ON public.patient_profiles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('ADMIN', 'CARETAKER')
  )
);

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

CREATE POLICY "patient_profiles_delete_policy" ON public.patient_profiles
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 3. PATIENT ACCESS POLICIES
-- ==============================================================================
CREATE POLICY "patient_access_select_policy" ON public.patient_access
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR public.has_patient_access(patient_id, 'can_view_care_circle')
);

CREATE POLICY "patient_access_insert_policy" ON public.patient_access
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_access')
);

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

CREATE POLICY "patient_access_delete_policy" ON public.patient_access
FOR DELETE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_access')
);

-- ==============================================================================
-- 4. MEDICATIONS POLICIES
-- ==============================================================================
CREATE POLICY "medications_select_policy" ON public.medications
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_medications')
);

CREATE POLICY "medications_insert_policy" ON public.medications
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_medications')
);

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

CREATE POLICY "medications_delete_policy" ON public.medications
FOR DELETE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_medications')
);

-- ==============================================================================
-- 5. MEDICATION LOGS POLICIES
-- ==============================================================================
CREATE POLICY "medication_logs_select_policy" ON public.medication_logs
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_medications')
);

CREATE POLICY "medication_logs_insert_policy" ON public.medication_logs
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_medications')
);

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

CREATE POLICY "medication_logs_delete_policy" ON public.medication_logs
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 6. APPOINTMENTS POLICIES
-- ==============================================================================
CREATE POLICY "appointments_select_policy" ON public.appointments
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_appointments')
);

CREATE POLICY "appointments_insert_policy" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_appointments')
);

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

CREATE POLICY "appointments_delete_policy" ON public.appointments
FOR DELETE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_appointments')
);

-- ==============================================================================
-- 7. HEALTHCARE ROUTINES POLICIES
-- ==============================================================================
CREATE POLICY "routines_select_policy" ON public.healthcare_routines
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_routines')
);

CREATE POLICY "routines_insert_policy" ON public.healthcare_routines
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_routines')
);

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

CREATE POLICY "routines_delete_policy" ON public.healthcare_routines
FOR DELETE TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_manage_routines')
);

-- ==============================================================================
-- 8. ROUTINE LOGS POLICIES
-- ==============================================================================
CREATE POLICY "routine_logs_select_policy" ON public.routine_logs
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_routines')
);

CREATE POLICY "routine_logs_insert_policy" ON public.routine_logs
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_log_routines')
);

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

CREATE POLICY "routine_logs_delete_policy" ON public.routine_logs
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 9. ASSISTANCE REQUESTS POLICIES
-- ==============================================================================
CREATE POLICY "assistance_select_policy" ON public.assistance_requests
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_create_assistance')
  OR public.has_patient_access(patient_id, 'can_resolve_assistance')
);

CREATE POLICY "assistance_insert_policy" ON public.assistance_requests
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_create_assistance')
);

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

CREATE POLICY "assistance_delete_policy" ON public.assistance_requests
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 10. NOTIFICATIONS POLICIES
-- ==============================================================================
CREATE POLICY "notifications_select_policy" ON public.notifications
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR recipient_id = auth.uid()
  OR recipient_email = (auth.jwt()->>'email')
  OR public.has_patient_access(patient_id, 'can_view_audit')
);

CREATE POLICY "notifications_insert_policy" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Notifications updates are forbidden directly; retries route through retry_failed_notification RPC
CREATE POLICY "notifications_update_policy" ON public.notifications
FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "notifications_delete_policy" ON public.notifications
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 11. ACTIVITY LOGS POLICIES (Append-only)
-- ==============================================================================
CREATE POLICY "activity_logs_select_policy" ON public.activity_logs
FOR SELECT TO authenticated
USING (
  public.is_admin() 
  OR public.has_patient_access(patient_id, 'can_view_audit')
);

CREATE POLICY "activity_logs_insert_policy" ON public.activity_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Strict append-only enforcement: No client updates or deletes allowed
CREATE POLICY "activity_logs_no_update" ON public.activity_logs
FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "activity_logs_no_delete" ON public.activity_logs
FOR DELETE TO authenticated
USING (false);
