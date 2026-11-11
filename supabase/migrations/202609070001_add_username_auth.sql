-- Username authentication for NEVISSAA mobile app.
-- This migration does NOT enable email confirmation and does not change existing passwords.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null or username ~ '^[A-Za-z0-9_]{3,30}$'
  )
);

alter table public.profiles enable row level security;

-- A user may read only their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

-- A user may update only their own username.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Keep a profile row in sync with newly-created Supabase Auth users.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    nullif(lower(trim(coalesce(new.raw_user_meta_data ->> 'username', ''))), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- Backfill users that already have a username in user_metadata, avoiding duplicates.
with candidates as (
  select
    u.id,
    nullif(lower(trim(u.raw_user_meta_data ->> 'username')), '') as username,
    row_number() over (
      partition by lower(trim(u.raw_user_meta_data ->> 'username'))
      order by u.created_at, u.id
    ) as rn
  from auth.users u
  where nullif(lower(trim(u.raw_user_meta_data ->> 'username')), '') is not null
)
insert into public.profiles (id, username)
select id, username
from candidates
where rn = 1
  and username ~ '^[a-z0-9_]{3,30}$'
on conflict (id) do update
set username = excluded.username
where public.profiles.username is null;

-- Check username availability without exposing the profiles table to anonymous clients.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(p_username))
  );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- Resolve username -> email during login without exposing the profiles table.
-- Email confirmation remains untouched; the mobile app still uses signInWithPassword.
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
set search_path = public, auth
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(trim(p_username))
    and u.email is not null
  limit 1;
$$;

revoke all on function public.get_email_by_username(text) from public;
grant execute on function public.get_email_by_username(text) to anon, authenticated;

comment on function public.get_email_by_username(text)
is 'Resolve one username to its authentication email for password login.';
