/*
# Zarinpal payment tracking

Replaces Stripe with Zarinpal for Iranian payments.
Amounts stored in Rial (ریال).
*/

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS zarinpal_ref_id text;

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('pro', 'business')),
  amount bigint NOT NULL,
  authority text NOT NULL UNIQUE,
  ref_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payment_transactions;
CREATE POLICY "select_own_payments"
  ON payment_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_authority ON payment_transactions(authority);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
