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
