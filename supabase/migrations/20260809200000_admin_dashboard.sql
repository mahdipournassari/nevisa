/* Admin dashboard access control.
   Add trusted auth user IDs to admin_users. Do NOT expose this table to clients.
   Example after creating an account:
     insert into public.admin_users (user_id) values ('AUTH_USER_UUID');
*/

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_no_client_access" ON public.admin_users;
-- No authenticated policies: only service_role can read/write this table.

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
