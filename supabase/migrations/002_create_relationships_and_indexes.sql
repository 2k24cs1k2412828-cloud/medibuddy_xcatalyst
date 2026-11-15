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
