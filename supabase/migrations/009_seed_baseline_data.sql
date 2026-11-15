# MEDICARE CONNECT — PHASE 5
# RESEND EMAIL NOTIFICATION SYSTEM IMPLEMENTATION

Phase 4 is reported complete. Now implement the real email notification infrastructure directly in the existing Next.js project.

This is a coding task. Do not produce another architecture document.

## 1. Inspect existing implementation

Inspect:
- Existing notifications SQL migration.
- Notification table schema and constraints.
- Existing notification-related RPC functions.
- Existing Server Actions.
- Supabase server and admin clients.
- Next.js version and route conventions.
- Existing environment configuration.

Preserve existing implementation and avoid duplicate database functions.

## 2. Resend integration

Integrate the Resend SDK.

Create a server-only email service module.

Requirements:
- Never expose RESEND_API_KEY to the browser.
- Use verified sender configuration.
- Create reusable responsive HTML email templates.
- Include plain-text email alternatives.
- Handle provider errors.
- Persist Resend message IDs.
- Use provider-supported idempotency mechanisms where available.
- Do not claim exactly-once delivery.

## 3. Notification event generation

Integrate notification creation with existing domain actions.

Support:
- UPCOMING_DOSE
- MISSED_DOSE
- APPOINTMENT_REMINDER
- ASSISTANCE_ALERT
- SCHEDULE_CHANGE

Requirements:
- Validate recipients against active patient assignments and notification permissions.
- Avoid sending notifications to revoked users.
- Generate deterministic event identifiers.
- Avoid duplicate queue records.
- Do not expose sensitive medical information unnecessarily in email content.

SOS alerts must be prioritized over routine reminders.

## 4. Notification worker

Implement:

/api/cron/process-reminders

Use the existing database claim RPC and lease architecture.

Requirements:
- Validate a strong CRON_SECRET using timing-safe comparison.
- Reject unauthorized requests.
- Claim due notifications atomically.
- Respect worker lease ownership.
- Send emails through Resend.
- Persist provider message IDs.
- Update status only when the worker still owns the claim.
- Handle expired leases.
- Handle exhausted attempts.
- Use bounded exponential backoff.
- Prevent unbounded retry loops.
- Log failures without leaking credentials or sensitive patient data.

Do not hold database transactions open during external HTTP requests.

## 5. Scheduling

Implement reminder scheduling for:
- Upcoming medication doses.
- Overdue medication doses after the configured grace period.
- Upcoming appointments.
- Assistance requests.

Use the patient's configured timezone.

Never mark a dose TAKEN automatically.

Avoid creating duplicate notifications on repeated cron runs.

## 6. Email templates

Create templates for:
- Medication reminder.
- Missed medication alert.
- Appointment reminder.
- SOS and urgent assistance.
- General assistance request.

Keep messages clear, professional, accessible and privacy-conscious.

## 7. Environment variables

Prepare:

RESEND_API_KEY=
RESEND_FROM_EMAIL=
CRON_SECRET=

Use existing Supabase environment variables.

Do not insert real secrets into source code, documentation, or Git.

## 8. Testing

Create and execute tests where possible:

1. Unauthorized cron request rejected.
2. Authorized cron request accepted.
3. Duplicate event does not create duplicate notification.
4. Only due notifications are claimed.
5. Concurrent workers cannot own the same active lease.
6. Expired lease recovery works.
7. Exhausted retries transition to FAILED.
8. Resend failures are recorded.
9. Successful delivery records the external ID.
10. Revoked recipients are excluded.
11. SOS notifications receive priority.
12. Sensitive data is not unnecessarily exposed.

Use mocked provider responses for automated unit tests, and separately identify whether live Resend delivery has been verified.

## 9. Final deliverables

Provide:
- New and modified files.
- Notification worker implementation.
- Resend service and templates.
- Database functions reused or modified.
- Environment variable setup.
- Cron configuration instructions.
- Test results.
- Unresolved issues.

Do not proceed to deployment.
Do not claim live delivery without an actual successful delivery test.
Preserve all existing Phase 1–4 functionality.-- ==============================================================================
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
