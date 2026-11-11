# Subscription logic update

This version keeps the existing Supabase schema and Zarinpal payment flow.

## Rules

- Same plan + active subscription: add 30 days to `current_period_end`.
- Same plan + expired/free: start a fresh 30-day period from now.
- Different plan (upgrade/downgrade): start the selected plan from now for 30 days.
- Repeated Zarinpal callbacks cannot complete the same pending payment twice.
- A completed payment repair uses the same renewal/plan-change rules and does not overwrite a newer subscription when `zarinpal_ref_id` is already present.

No new database migration is required for this update.
