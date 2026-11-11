-- Allow existing users to choose a username without changing their Auth account,
-- email, password, subscriptions, or email-confirmation settings.

-- Ensure every existing Auth user has a profile row.
insert into public.profiles (id, username)
select u.id, null
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Securely set/check a username for the currently signed-in user.
-- The unique constraint on profiles.username prevents duplicate usernames.
create or replace function public.set_my_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_username text := lower(trim(coalesce(p_username, '')));
  current_id uuid := auth.uid();
  existing_id uuid;
begin
  if current_id is null then
    raise exception 'not_authenticated';
  end if;

  if clean_username !~ '^[a-z0-9_]{3,30}$' then
    raise exception 'invalid_username';
  end if;

  select id into existing_id
  from public.profiles
  where lower(username) = clean_username
    and id <> current_id
  limit 1;

  if existing_id is not null then
    raise exception 'username_taken';
  end if;

  insert into public.profiles (id, username)
  values (current_id, clean_username)
  on conflict (id) do update
    set username = excluded.username;

  return clean_username;
end;
$$;

revoke all on function public.set_my_username(text) from public;
grant execute on function public.set_my_username(text) to authenticated;

comment on function public.set_my_username(text)
is 'Sets the username for the currently authenticated user without modifying the Supabase Auth account.';
