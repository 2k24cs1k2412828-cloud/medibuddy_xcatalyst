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
