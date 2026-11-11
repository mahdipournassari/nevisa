# Usage tracking fix

Two issues were fixed:

1. `getUsageStats()` was filtering `user_generations.status = completed`, but the current table does not have a `status` column. That made Supabase return an error and the UI fall back to zero usage. Usage now counts non-deleted generation rows directly.
2. `generation_reservations` is a temporary quota-lock table. The previous implementation deleted the reservation after success, so it looked empty after a successful generation. The new migration keeps an audit row and marks it `completed` or `released`; only `reserved` rows count toward an in-flight quota.

Run `supabase/migrations/20260811130000_fix_usage_tracking.sql` in Supabase SQL Editor.
