-- ### keep alert delivery addresses aligned with verified Auth email changes
create or replace function app_private.sync_profile_email_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or new.email is not distinct from old.email then
    return new;
  end if;

  -- ### clear stale unique claims so a verified Auth email can become the profile delivery address
  update public.profiles
  set email = null
  where email = new.email
    and id <> new.id;

  update public.profiles
  set email = new.email
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function app_private.sync_profile_email_from_auth_user();

-- ### repair existing profile rows that drifted from auth.users.email before the update trigger existed
update public.profiles as profile
set email = null
where exists (
  select 1
  from auth.users as auth_user
  where auth_user.email = profile.email
    and auth_user.id <> profile.id
)
and exists (
  select 1
  from auth.users as auth_user
  where auth_user.id = profile.id
    and auth_user.email is distinct from profile.email
);

update public.profiles as profile
set email = auth_user.email
from auth.users as auth_user
where profile.id = auth_user.id
  and auth_user.email is not null
  and profile.email is distinct from auth_user.email;
