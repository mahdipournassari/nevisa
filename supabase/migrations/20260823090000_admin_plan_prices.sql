-- Allow admins to change subscription prices from the Admin panel.
ALTER TABLE public.plan_limits
  ADD COLUMN IF NOT EXISTS price bigint NOT NULL DEFAULT 0 CHECK (price >= 0);

UPDATE public.plan_limits SET price = 0 WHERE plan = 'free';
UPDATE public.plan_limits SET price = 4990000 WHERE plan = 'pro' AND (price = 0 OR price IS NULL);
UPDATE public.plan_limits SET price = 14990000 WHERE plan = 'business' AND (price = 0 OR price IS NULL);
