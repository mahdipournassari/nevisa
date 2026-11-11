-- Usage v3: make generation_reservations the source of truth for quota.
-- Existing installations may already contain generations created before the
-- reservation audit trail was enabled. Backfill them only when no completed
-- reservations exist yet, preventing duplicate usage in a fresh upgrade.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.generation_reservations WHERE status = 'completed') THEN
    INSERT INTO public.generation_reservations (user_id, status, created_at, finalized_at)
    SELECT user_id, 'completed', created_at, created_at
    FROM public.user_generations;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_generation_reservations_usage
  ON public.generation_reservations(user_id, status, created_at);

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

REVOKE ALL ON FUNCTION public.reserve_generation_slot(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_generation_slot(uuid, integer, integer) TO service_role;
