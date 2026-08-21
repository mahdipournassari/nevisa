-- Keep generation_reservations as an immutable usage/audit trail.
-- Usage is counted from completed reservations (plus currently active reservations).
-- Deleting History rows must never restore quota.

ALTER TABLE public.generation_reservations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'completed', 'released'));

ALTER TABLE public.generation_reservations
  ADD COLUMN IF NOT EXISTS finalized_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_generation_reservations_user_status_created
  ON public.generation_reservations(user_id, status, created_at DESC);

-- Existing old rows are active reservations only if they are still fresh.
UPDATE public.generation_reservations
SET status = 'released', finalized_at = now()
WHERE status = 'reserved'
  AND created_at < now() - interval '2 minutes';

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
  active_daily integer;
  active_monthly integer;
  new_id uuid;
  day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  month_start timestamptz := date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  UPDATE public.generation_reservations
  SET status = 'released', finalized_at = now()
  WHERE status = 'reserved'
    AND created_at < now() - interval '2 minutes';

  SELECT count(*) INTO daily_used
  FROM public.generation_reservations
  WHERE user_id = p_user_id
    AND status IN ('completed', 'reserved')
    AND created_at >= day_start;

  IF daily_used >= p_daily_limit THEN
    RETURN QUERY SELECT NULL::uuid, 'daily'::text;
    RETURN;
  END IF;

  SELECT count(*) INTO monthly_used
  FROM public.generation_reservations
  WHERE user_id = p_user_id
    AND status IN ('completed', 'reserved')
    AND created_at >= month_start;

  IF monthly_used >= p_monthly_limit THEN
    RETURN QUERY SELECT NULL::uuid, 'monthly'::text;
    RETURN;
  END IF;

  INSERT INTO public.generation_reservations(user_id, status)
  VALUES (p_user_id, 'reserved')
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
  UPDATE public.generation_reservations
  SET status = 'released', finalized_at = now()
  WHERE id = p_reservation_id AND status = 'reserved';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_generation_slot(p_reservation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.generation_reservations
  SET status = 'completed', finalized_at = now()
  WHERE id = p_reservation_id AND status = 'reserved';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_generation_slot(uuid, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_generation_slot(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_generation_slot(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_generation_slot(uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_generation_slot(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_generation_slot(uuid) TO service_role;
