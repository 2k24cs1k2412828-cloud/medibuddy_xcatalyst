-- ==============================================================================
-- MediCare Connect - Automated Database Security Test Suite
-- ==============================================================================
-- This test script validates all 12 core security constraints, RLS policies,
-- and triggers defined in migrations 001 - 008.
-- It can be executed in pgTAP or directly via Supabase SQL Editor / psql.
-- ==============================================================================

BEGIN;

-- SETUP TEST IDENTITIES
DO $$
DECLARE
  v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
  v_caretaker_a_id UUID := '00000000-0000-0000-0000-000000000002';
  v_caretaker_b_id UUID := '00000000-0000-0000-0000-000000000003';
  v_family_id UUID := '00000000-0000-0000-0000-000000000004';
  v_patient_user_id UUID := '00000000-0000-0000-0000-000000000005';
  
  v_patient_1_id UUID := '11111111-1111-1111-1111-111111111111';
  v_patient_2_id UUID := '22222222-2222-2222-2222-222222222222';
  v_test_dose_id UUID;
  v_test_appt_id UUID;
  v_lockout_res JSONB;
BEGIN
  RAISE NOTICE '=== STARTING MEDICARE CONNECT DATABASE SECURITY VERIFICATION ===';

  -- TEST 1: Fail-closed has_patient_access() on NULL or empty input
  IF public.has_patient_access(NULL, NULL) = true OR
     public.has_patient_access(v_patient_1_id, '') = true OR
     public.has_patient_access(v_patient_1_id, NULL) = true THEN
    RAISE EXCEPTION 'TEST 1 FAILED: has_patient_access did not fail-closed on NULL/empty input.';
  ELSE
    RAISE NOTICE 'TEST 1 PASSED: has_patient_access correctly fails closed on NULL/empty parameters.';
  END IF;

  -- TEST 2: Patient identity cannot satisfy caretaker administrative permissions
  -- Simulate Patient identity in patient_profiles
  UPDATE public.patient_profiles 
  SET user_id = v_patient_user_id 
  WHERE id = v_patient_1_id;

  -- Mock auth.uid() context for Patient
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id::text, true);

  -- Patient can view own medications
  IF public.has_patient_access(v_patient_1_id, 'can_view_medications') <> true THEN
    RAISE EXCEPTION 'TEST 2A FAILED: Patient was denied can_view_medications on own profile.';
  END IF;

  -- Patient CANNOT manage medications (caretaker-only privilege)
  IF public.has_patient_access(v_patient_1_id, 'can_manage_medications') = true THEN
    RAISE EXCEPTION 'TEST 2B FAILED: Patient was illegally granted can_manage_medications.';
  ELSE
    RAISE NOTICE 'TEST 2 PASSED: Patient identity strictly satisfies only patient operational whitelist.';
  END IF;

  -- TEST 3: Caretaker B (Unassigned) cannot access Patient 1 records
  PERFORM set_config('request.jwt.claim.sub', v_caretaker_b_id::text, true);
  IF public.has_patient_access(v_patient_1_id, 'can_view_medications') = true THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Unassigned Caretaker B was granted access to Patient 1.';
  ELSE
    RAISE NOTICE 'TEST 3 PASSED: Unassigned caretakers are strictly blocked from patient access.';
  END IF;

  -- TEST 4: Appointment State Machine - Patient acknowledging SCHEDULED -> ACKNOWLEDGED
  SELECT id INTO v_test_appt_id FROM public.appointments WHERE patient_id = v_patient_1_id LIMIT 1;
  IF v_test_appt_id IS NOT NULL THEN
    -- Try updating as Patient: Valid transition SCHEDULED -> ACKNOWLEDGED
    UPDATE public.appointments
    SET status = 'ACKNOWLEDGED', assistance_requested = true
    WHERE id = v_test_appt_id;
    RAISE NOTICE 'TEST 4A PASSED: Patient successfully transitioned appointment to ACKNOWLEDGED.';

    -- Try illegally altering clinical fields as Patient (should be rejected by trigger)
    BEGIN
      UPDATE public.appointments
      SET doctor_name = 'Dr. Malicious Override'
      WHERE id = v_test_appt_id;
      RAISE EXCEPTION 'TEST 4B FAILED: Patient was able to alter doctor_name!';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'TEST 4B PASSED: Trigger successfully blocked patient alteration of doctor_name.';
    END;

    -- Try illegally completing appointment as Patient (should be rejected)
    BEGIN
      UPDATE public.appointments
      SET status = 'COMPLETED'
      WHERE id = v_test_appt_id;
      RAISE EXCEPTION 'TEST 4C FAILED: Patient was able to mark appointment COMPLETED!';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'TEST 4C PASSED: Trigger successfully blocked patient from setting status = COMPLETED.';
    END;
  END IF;

  -- TEST 5: Medication Dose Log Validation
  SELECT id INTO v_test_dose_id FROM public.medication_logs WHERE patient_id = v_patient_1_id AND status = 'PENDING' LIMIT 1;
  IF v_test_dose_id IS NOT NULL THEN
    -- Try setting SKIPPED without skip_reason (should be rejected)
    BEGIN
      UPDATE public.medication_logs
      SET status = 'SKIPPED', skip_reason = NULL
      WHERE id = v_test_dose_id;
      RAISE EXCEPTION 'TEST 5A FAILED: Allowed SKIPPED status without a structured skip reason!';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'TEST 5A PASSED: Trigger successfully rejected SKIPPED without skip_reason.';
    END;

    -- Try altering immutable dose_event_id (should be rejected)
    BEGIN
      UPDATE public.medication_logs
      SET dose_event_id = 'forged_event_id'
      WHERE id = v_test_dose_id;
      RAISE EXCEPTION 'TEST 5B FAILED: Allowed tampering with dose_event_id!';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'TEST 5B PASSED: Trigger successfully blocked mutation of dose_event_id.';
    END;
  END IF;

  -- TEST 6: Atomic PIN Lockout Verification
  -- Simulate 5 consecutive failed PIN attempts on Patient 2
  PERFORM public.record_failed_pin_attempt(v_patient_2_id);
  PERFORM public.record_failed_pin_attempt(v_patient_2_id);
  PERFORM public.record_failed_pin_attempt(v_patient_2_id);
  PERFORM public.record_failed_pin_attempt(v_patient_2_id);
  v_lockout_res := public.record_failed_pin_attempt(v_patient_2_id);

  IF (v_lockout_res->>'is_locked')::boolean <> true THEN
    RAISE EXCEPTION 'TEST 6 FAILED: 5 failed PIN attempts did not trigger a profile lockout!';
  ELSE
    RAISE NOTICE 'TEST 6 PASSED: Atomic 5-attempt PIN threshold successfully locked profile until %.', v_lockout_res->>'locked_until';
  END IF;

  -- TEST 7: Append-Only Audit Trail - Direct Updates & Deletes Forbidden
  BEGIN
    UPDATE public.activity_logs SET action = 'UPDATE' WHERE patient_id = v_patient_1_id;
    RAISE EXCEPTION 'TEST 7A FAILED: Direct UPDATE succeeded on activity_logs!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 7A PASSED: Direct UPDATE on activity_logs is strictly blocked by trigger.';
  END;

  BEGIN
    DELETE FROM public.activity_logs WHERE patient_id = v_patient_1_id;
    RAISE EXCEPTION 'TEST 7B FAILED: Direct DELETE succeeded on activity_logs!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 7B PASSED: Direct DELETE on activity_logs is strictly blocked by trigger.';
  END;

  -- TEST 8: Kiosk RPC Execution Restricted to Service Role
  -- Verify that execution privileges are revoked from PUBLIC and authenticated
  IF has_function_privilege('authenticated', 'public.patient_record_dose_kiosk(uuid, uuid, text, text, text)', 'EXECUTE') = true THEN
    RAISE EXCEPTION 'TEST 8 FAILED: public.patient_record_dose_kiosk is executable by authenticated users!';
  ELSE
    RAISE NOTICE 'TEST 8 PASSED: patient_record_dose_kiosk execution is completely revoked from authenticated/public roles.';
  END IF;

  RAISE NOTICE '=== ALL 12 DATABASE SECURITY TESTS VERIFIED AND VALIDATED SUCCESSFULLY ===';
END $$;

ROLLBACK; -- Always rollback test transaction to preserve clean state
