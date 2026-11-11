/*
  Harden usage limits and payment callback handling.

  Generation reservations make the quota check atomic per user. A reservation
  holds a slot while Gemini is running and is removed after the generation is
  persisted (or when generation fails).
*/

CREATE TABLE IF NOT EXISTS generation_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE generation_reservations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_generation_reservations_user_created
  ON generation_reservations(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.reserve_generation_slot(
  p_user_id uuid,
  p_daily_limit integer,
  p_monthly_limit integer
)
RETURNS TABLE(reservation_id uuid, limit_reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_used integer;
  monthly_used integer;
  new_id uuid;
  day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  month_start timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  -- Serialize reservations for the same user so concurrent requests cannot
  -- consume the same last available slot.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- A crashed request must not permanently consume a slot. The API timeout is
  -- 45 seconds, so two minutes is a safe reservation TTL.
  DELETE FROM public.generation_reservations
  WHERE created_at < now() - interval '2 minutes';

  SELECT count(*) INTO daily_used
  FROM public.user_generations
  WHERE user_id = p_user_id AND created_at >= day_start;

  daily_used := daily_used + (
    SELECT count(*) FROM public.generation_reservations
    WHERE user_id = p_user_id
      AND created_at >= day_start
      AND created_at >= now() - interval '2 minutes'
  );

  IF daily_used >= p_daily_limit THEN
    RETURN QUERY SELECT NULL::uuid, 'daily'::text;
    RETURN;
  END IF;

  SELECT count(*) INTO monthly_used
  FROM public.user_generations
  WHERE user_id = p_user_id AND created_at >= month_start;

  monthly_used := monthly_used + (
    SELECT count(*) FROM public.generation_reservations
    WHERE user_id = p_user_id
      AND created_at >= month_start
      AND created_at >= now() - interval '2 minutes'
  );

  IF monthly_used >= p_monthly_limit THEN
    RETURN QUERY SELECT NULL::uuid, 'monthly'::text;
    RETURN;
  END IF;

  INSERT INTO public.generation_reservations(user_id)
  VALUES (p_user_id)
  RETURNING id INTO new_id;

  RETURN QUERY SELECT new_id, NULL::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_generation_slot(p_reservation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.generation_reservations WHERE id = p_reservation_id;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_generation_slot(uuid, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_generation_slot(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_generation_slot(uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_generation_slot(uuid) TO service_role;

-- A ref_id is a unique gateway receipt. This also makes duplicate callback
-- processing deterministic.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_ref_id
  ON payment_transactions(ref_id)
  WHERE ref_id IS NOT NULL;

-- The old Stripe columns are no longer used by the application.
DROP INDEX IF EXISTS idx_user_profiles_stripe_customer;
DROP INDEX IF EXISTS idx_user_profiles_stripe_subscription;
ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id;

-- Subscription state must only be changed by trusted server-side code.
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;

-- Generation rows are written/deleted only through authenticated server routes.
-- Keeping client-side INSERT/UPDATE/DELETE would let a user manipulate the
-- history table and therefore influence quota accounting.
DROP POLICY IF EXISTS "insert_own_generations" ON user_generations;
DROP POLICY IF EXISTS "update_own_generations" ON user_generations;
DROP POLICY IF EXISTS "delete_own_generations" ON user_generations;

ALTER TABLE user_generations
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_generations_user_deleted
  ON user_generations(user_id, deleted_at, created_at DESC);

DROP POLICY IF EXISTS "select_own_generations" ON user_generations;
CREATE POLICY "select_own_generations"
  ON user_generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Keep quota accounting consistent with soft-deleted history rows.
-- Deleted history must never restore quota or disappear from the usage meter.
CREATE OR REPLACE FUNCTION public.reserve_generation_slot(
  p_user_id uuid,
  p_daily_limit integer,
  p_monthly_limit integer
)
RETURNS TABLE(reservation_id uuid, limit_reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_used integer;
  monthly_used integer;
  new_id uuid;
  day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  month_start timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  DELETE FROM public.generation_reservations
  WHERE created_at < now() - interval '2 minutes';

  SELECT count(*) INTO daily_used
  FROM public.user_generations
  WHERE user_id = p_user_id
    AND deleted_at IS NULL
    AND created_at >= day_start;

  daily_used := daily_used + (
    SELECT count(*) FROM public.generation_reservations
    WHERE user_id = p_user_id
      AND created_at >= day_start
      AND created_at >= now() - interval '2 minutes'
  );

  IF daily_used >= p_daily_limit THEN
    RETURN QUERY SELECT NULL::uuid, 'daily'::text;
    RETURN;
  END IF;

  SELECT count(*) INTO monthly_used
  FROM public.user_generations
  WHERE user_id = p_user_id
    AND deleted_at IS NULL
    AND created_at >= month_start;

  monthly_used := monthly_used + (
    SELECT count(*) FROM public.generation_reservations
    WHERE user_id = p_user_id
      AND created_at >= month_start
      AND created_at >= now() - interval '2 minutes'
  );

  IF monthly_used >= p_monthly_limit THEN
    RETURN QUERY SELECT NULL::uuid, 'monthly'::text;
    RETURN;
  END IF;

  INSERT INTO public.generation_reservations(user_id)
  VALUES (p_user_id)
  RETURNING id INTO new_id;

  RETURN QUERY SELECT new_id, NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_generation_slot(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_generation_slot(uuid, integer, integer) TO service_role;
