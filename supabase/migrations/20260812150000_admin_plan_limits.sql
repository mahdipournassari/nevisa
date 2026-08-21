-- Admin-managed daily/monthly generation limits.
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan text PRIMARY KEY CHECK (plan IN ('free', 'pro', 'business')),
  daily_limit integer NOT NULL CHECK (daily_limit >= 0),
  monthly_limit integer NOT NULL CHECK (monthly_limit >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

INSERT INTO public.plan_limits (plan, daily_limit, monthly_limit)
VALUES
  ('free', 10, 200),
  ('pro', 25, 500),
  ('business', 50, 2000)
ON CONFLICT (plan) DO UPDATE SET
  daily_limit = EXCLUDED.daily_limit,
  monthly_limit = EXCLUDED.monthly_limit;

DROP POLICY IF EXISTS "admins_read_plan_limits" ON public.plan_limits;
CREATE POLICY "admins_read_plan_limits"
  ON public.plan_limits FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins_update_plan_limits" ON public.plan_limits;
CREATE POLICY "admins_update_plan_limits"
  ON public.plan_limits FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_plan_limits_updated_at ON public.plan_limits(updated_at DESC);
